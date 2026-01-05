import { NextRequest, NextResponse } from "next/server";
import { AnimalRepository, type AnimalFilters, type CreateAnimalData } from "@/lib/repositories/animal";
import { getCurrentUser } from "@/lib/auth/server";
import { checkFarmAccess } from "@/lib/auth/permissions";
import {
  validateRequestBody,
  validateRequestBodyWithLocale,
  validateQueryParams,
  animalCreateSchema,
  animalFiltersSchema,
  createValidationResponse,
  getValidationSchemas,
} from "@/lib/middleware/validation";
import {
  handleApiError,
  withErrorHandler,
  ValidationError,
  BusinessLogicError,
  NotFoundError,
  AuthorizationError,
} from "@/lib/middleware/error-handler";
import { validateAnimalStatusTransition, validateEventCreation } from "@/lib/middleware/business-validation";
import type { ApiResponse } from "@/lib/types";
import { getLocaleFromRequest } from "@/lib/utils/i18n-errors";

const animalRepository = new AnimalRepository();

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ farmId: string }> }) => {
    const { farmId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      throw new AuthorizationError("Authentication required", "UNAUTHORIZED");
    }

    // Check if user has access to this farm
    const hasPermission = await checkFarmAccess(user.id, farmId, "READ");
    if (!hasPermission) {
      throw new AuthorizationError("Access denied to this farm", "FORBIDDEN");
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const validation = validateQueryParams(animalFiltersSchema, searchParams);

    if (!validation.success) {
      throw new ValidationError("Invalid query parameters", validation.errors!);
    }

    const filters: AnimalFilters = validation.data!;

    const animals = await animalRepository.findByFarmId(farmId, filters);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: animals,
    });
  },
  { operation: "GET_ANIMALS", farmId: "farmId" }
);

export const POST = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ farmId: string }> }) => {
    const { farmId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      throw new AuthorizationError("Authentication required", "UNAUTHORIZED");
    }

    // Check if user has create permission for this farm
    const hasPermission = await checkFarmAccess(user.id, farmId, "CREATE");
    if (!hasPermission) {
      throw new AuthorizationError("Insufficient permissions to create animals", "FORBIDDEN");
    }

    const body = await request.json();

    // Get locale from request
    const locale = getLocaleFromRequest(request);
    const schemas = getValidationSchemas();

    // Validate request body with translated messages
    const validation = await validateRequestBodyWithLocale(schemas.createAnimalCreateSchema, body, locale);

    if (!validation.success) {
      throw new ValidationError("Invalid animal data", validation.errors!, "VALIDATION_ERROR");
    }

    const validatedData = validation.data!;

    // Business logic validation
    if (validatedData.type === "LOT" && !validatedData.lotCount) {
      throw new BusinessLogicError("Lot count is required for LOT type animals", "LOT_COUNT_REQUIRED");
    }

    if (validatedData.type === "INDIVIDUAL" && validatedData.lotCount) {
      throw new BusinessLogicError(
        "Lot count should not be provided for individual animals",
        "INDIVIDUAL_NO_LOT_COUNT"
      );
    }

    // Validate birth date is not in the future
    if (validatedData.birthDate) {
      const birthDate = new Date(validatedData.birthDate);
      if (birthDate > new Date()) {
        throw new BusinessLogicError("Birth date cannot be in the future", "FUTURE_BIRTH_DATE");
      }
    }

    const animalData: CreateAnimalData = {
      farmId: farmId,
      tagNumber: validatedData.tagNumber,
      type: validatedData.type,
      species: validatedData.species,
      sex: validatedData.sex,
      birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined,
      estimatedAge: validatedData.estimatedAge,
      status: validatedData.status || "ACTIVE",
      photoUrl: validatedData.photoUrl,
      lotCount: validatedData.lotCount,
      createdBy: user.id,
    };

    const animal = await animalRepository.create(animalData);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: animal,
        message: "Animal created successfully",
      },
      { status: 201 }
    );
  },
  { operation: "CREATE_ANIMAL", farmId: "farmId" }
);
