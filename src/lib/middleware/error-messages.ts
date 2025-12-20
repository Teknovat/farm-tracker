import { type Locale } from '@/i18n/request'

// Error message translations for different locales
export const ErrorMessages = {
    // Authentication and Authorization Errors
    UNAUTHORIZED: {
        en: 'You must be logged in to access this resource',
        fr: 'Vous devez être connecté pour accéder à cette ressource',
        ar: 'يجب أن تكون مسجل الدخول للوصول إلى هذا المورد'
    },
    FORBIDDEN: {
        en: 'You do not have permission to perform this action',
        fr: 'Vous n\'avez pas la permission d\'effectuer cette action',
        ar: 'ليس لديك إذن لتنفيذ هذا الإجراء'
    },
    INVALID_CREDENTIALS: {
        en: 'Invalid email or password',
        fr: 'Email ou mot de passe invalide',
        ar: 'بريد إلكتروني أو كلمة مرور غير صحيحة'
    },

    // Resource Errors
    NOT_FOUND: {
        en: 'The requested resource was not found',
        fr: 'La ressource demandée n\'a pas été trouvée',
        ar: 'المورد المطلوب غير موجود'
    },
    ANIMAL_NOT_FOUND: {
        en: 'Animal not found',
        fr: 'Animal non trouvé',
        ar: 'الحيوان غير موجود'
    },
    FARM_NOT_FOUND: {
        en: 'Farm not found',
        fr: 'Ferme non trouvée',
        ar: 'المزرعة غير موجودة'
    },
    EVENT_NOT_FOUND: {
        en: 'Event not found',
        fr: 'Événement non trouvé',
        ar: 'الحدث غير موجود'
    },

    // Validation Errors
    VALIDATION_ERROR: {
        en: 'The provided data is invalid',
        fr: 'Les données fournies sont invalides',
        ar: 'البيانات المقدمة غير صحيحة'
    },
    REQUIRED_FIELD: {
        en: 'This field is required',
        fr: 'Ce champ est requis',
        ar: 'هذا الحقل مطلوب'
    },
    INVALID_EMAIL: {
        en: 'Please enter a valid email address',
        fr: 'Veuillez saisir une adresse email valide',
        ar: 'يرجى إدخال عنوان بريد إلكتروني صحيح'
    },
    INVALID_AMOUNT: {
        en: 'Amount must be a positive number',
        fr: 'Le montant doit être un nombre positif',
        ar: 'يجب أن يكون المبلغ رقماً موجباً'
    },
    INVALID_DATE: {
        en: 'Please enter a valid date',
        fr: 'Veuillez saisir une date valide',
        ar: 'يرجى إدخال تاريخ صحيح'
    },

    // Business Logic Errors
    INVALID_STATUS_TRANSITION: {
        en: 'Invalid status change',
        fr: 'Changement de statut invalide',
        ar: 'تغيير حالة غير صحيح'
    },
    HAS_ACTIVE_EVENTS: {
        en: 'Cannot change status - animal has upcoming events',
        fr: 'Impossible de changer le statut - l\'animal a des événements à venir',
        ar: 'لا يمكن تغيير الحالة - الحيوان لديه أحداث قادمة'
    },
    HAS_EVENTS: {
        en: 'Cannot delete animal with existing events',
        fr: 'Impossible de supprimer un animal avec des événements existants',
        ar: 'لا يمكن حذف حيوان له أحداث موجودة'
    },
    INACTIVE_TARGET: {
        en: 'Cannot create events for inactive animals',
        fr: 'Impossible de créer des événements pour des animaux inactifs',
        ar: 'لا يمكن إنشاء أحداث للحيوانات غير النشطة'
    },
    FUTURE_EVENT_NOT_ALLOWED: {
        en: 'This event type cannot be scheduled in the future',
        fr: 'Ce type d\'événement ne peut pas être programmé dans le futur',
        ar: 'لا يمكن جدولة هذا النوع من الأحداث في المستقبل'
    },
    ALREADY_DEAD: {
        en: 'Animal is already marked as dead',
        fr: 'L\'animal est déjà marqué comme décédé',
        ar: 'الحيوان مُعلم بالفعل كميت'
    },
    ALREADY_SOLD: {
        en: 'Animal is already marked as sold',
        fr: 'L\'animal est déjà marqué comme vendu',
        ar: 'الحيوان مُعلم بالفعل كمباع'
    },
    CANNOT_SELL_DEAD: {
        en: 'Cannot sell a dead animal',
        fr: 'Impossible de vendre un animal mort',
        ar: 'لا يمكن بيع حيوان ميت'
    },
    SALE_REQUIRES_COST: {
        en: 'Sale events must have a cost value',
        fr: 'Les événements de vente doivent avoir une valeur de coût',
        ar: 'أحداث البيع يجب أن تحتوي على قيمة التكلفة'
    },
    BIRTH_NOT_FOR_LOTS: {
        en: 'Birth events are not applicable to lot-type animals',
        fr: 'Les événements de naissance ne s\'appliquent pas aux animaux de type lot',
        ar: 'أحداث الولادة لا تنطبق على الحيوانات من نوع المجموعة'
    },
    BIRTH_EVENT_EXISTS: {
        en: 'Animal already has a birth event recorded',
        fr: 'L\'animal a déjà un événement de naissance enregistré',
        ar: 'الحيوان لديه بالفعل حدث ولادة مسجل'
    },
    DEATH_EVENT_EXISTS: {
        en: 'Animal already has a death event recorded',
        fr: 'L\'animal a déjà un événement de décès enregistré',
        ar: 'الحيوان لديه بالفعل حدث وفاة مسجل'
    },

    // Financial Errors
    INSUFFICIENT_BALANCE: {
        en: 'Insufficient cashbox balance',
        fr: 'Solde de caisse insuffisant',
        ar: 'رصيد الصندوق غير كافي'
    },
    CREDIT_EXPENSE_NOT_FOUND: {
        en: 'Credit expense not found',
        fr: 'Dépense à crédit non trouvée',
        ar: 'مصروف الائتمان غير موجود'
    },
    ALREADY_REIMBURSED: {
        en: 'Credit expense is already fully reimbursed',
        fr: 'La dépense à crédit est déjà entièrement remboursée',
        ar: 'مصروف الائتمان مسترد بالكامل بالفعل'
    },
    EXCEEDS_REMAINING_DEBT: {
        en: 'Reimbursement amount exceeds remaining debt',
        fr: 'Le montant du remboursement dépasse la dette restante',
        ar: 'مبلغ الاسترداد يتجاوز الدين المتبقي'
    },
    INVALID_REIMBURSEMENT_AMOUNT: {
        en: 'Reimbursement amount must be positive',
        fr: 'Le montant du remboursement doit être positif',
        ar: 'يجب أن يكون مبلغ الاسترداد موجباً'
    },

    // Member Management Errors
    MEMBER_NOT_FOUND: {
        en: 'Member not found in this farm',
        fr: 'Membre non trouvé dans cette ferme',
        ar: 'العضو غير موجود في هذه المزرعة'
    },
    LAST_OWNER_REMOVAL: {
        en: 'Cannot remove the last owner of the farm',
        fr: 'Impossible de supprimer le dernier propriétaire de la ferme',
        ar: 'لا يمكن إزالة المالك الأخير للمزرعة'
    },
    LAST_OWNER_ROLE_CHANGE: {
        en: 'Cannot change the role of the last owner',
        fr: 'Impossible de changer le rôle du dernier propriétaire',
        ar: 'لا يمكن تغيير دور المالك الأخير'
    },

    // Lot Management Errors
    NOT_A_LOT: {
        en: 'Count operations are only valid for lot-type animals',
        fr: 'Les opérations de comptage ne sont valides que pour les animaux de type lot',
        ar: 'عمليات العد صالحة فقط للحيوانات من نوع المجموعة'
    },
    INSUFFICIENT_LOT_COUNT: {
        en: 'Cannot decrease count - insufficient animals in lot',
        fr: 'Impossible de diminuer le nombre - animaux insuffisants dans le lot',
        ar: 'لا يمكن تقليل العدد - حيوانات غير كافية في المجموعة'
    },
    LOT_COUNT_ZERO: {
        en: 'Cannot reduce lot count to zero',
        fr: 'Impossible de réduire le nombre du lot à zéro',
        ar: 'لا يمكن تقليل عدد المجموعة إلى الصفر'
    },

    // Export Errors
    EXPORT_PERMISSION_DENIED: {
        en: 'You do not have permission to export data',
        fr: 'Vous n\'avez pas la permission d\'exporter des données',
        ar: 'ليس لديك إذن لتصدير البيانات'
    },
    FINANCIAL_EXPORT_RESTRICTED: {
        en: 'Only farm owners can export financial data',
        fr: 'Seuls les propriétaires de ferme peuvent exporter les données financières',
        ar: 'يمكن لمالكي المزارع فقط تصدير البيانات المالية'
    },

    // System Errors
    INTERNAL_ERROR: {
        en: 'An internal server error occurred',
        fr: 'Une erreur interne du serveur s\'est produite',
        ar: 'حدث خطأ داخلي في الخادم'
    },
    NETWORK_ERROR: {
        en: 'Network connection error',
        fr: 'Erreur de connexion réseau',
        ar: 'خطأ في اتصال الشبكة'
    },
    UNKNOWN_ERROR: {
        en: 'An unexpected error occurred',
        fr: 'Une erreur inattendue s\'est produite',
        ar: 'حدث خطأ غير متوقع'
    },

    // Database Errors
    DUPLICATE_RESOURCE: {
        en: 'This resource already exists',
        fr: 'Cette ressource existe déjà',
        ar: 'هذا المورد موجود بالفعل'
    },
    INVALID_REFERENCE: {
        en: 'Invalid reference to related resource',
        fr: 'Référence invalide à une ressource liée',
        ar: 'مرجع غير صحيح لمورد مرتبط'
    },
    MISSING_REQUIRED_FIELD: {
        en: 'Required field is missing',
        fr: 'Champ requis manquant',
        ar: 'حقل مطلوب مفقود'
    },
    CHECK_CONSTRAINT_VIOLATION: {
        en: 'Data validation constraint violated',
        fr: 'Contrainte de validation des données violée',
        ar: 'انتهاك قيد التحقق من صحة البيانات'
    }
}

// Helper function to get localized error message
export function getErrorMessage(
    errorCode: keyof typeof ErrorMessages,
    locale: Locale = 'fr',
    fallbackMessage?: string
): string {
    const messages = ErrorMessages[errorCode]

    if (!messages) {
        return fallbackMessage || ErrorMessages.UNKNOWN_ERROR[locale]
    }

    return messages[locale] || messages.fr || messages.en || fallbackMessage || 'Error'
}

// Helper function to create localized error response
export function createLocalizedErrorResponse(
    errorCode: keyof typeof ErrorMessages,
    locale: Locale = 'fr',
    statusCode: number = 400,
    details?: Array<{ field: string; message: string; code?: string }>
) {
    return {
        success: false,
        error: getErrorMessage(errorCode, locale),
        code: errorCode,
        details
    }
}

// Field-specific validation messages
export const FieldValidationMessages = {
    species: {
        required: {
            en: 'Species is required',
            fr: 'L\'espèce est requise',
            ar: 'النوع مطلوب'
        },
        maxLength: {
            en: 'Species name cannot exceed 100 characters',
            fr: 'Le nom de l\'espèce ne peut pas dépasser 100 caractères',
            ar: 'اسم النوع لا يمكن أن يتجاوز 100 حرف'
        }
    },
    amount: {
        required: {
            en: 'Amount is required',
            fr: 'Le montant est requis',
            ar: 'المبلغ مطلوب'
        },
        positive: {
            en: 'Amount must be positive',
            fr: 'Le montant doit être positif',
            ar: 'يجب أن يكون المبلغ موجباً'
        },
        maxValue: {
            en: 'Amount cannot exceed 1,000,000',
            fr: 'Le montant ne peut pas dépasser 1 000 000',
            ar: 'المبلغ لا يمكن أن يتجاوز 1,000,000'
        }
    },
    description: {
        required: {
            en: 'Description is required',
            fr: 'La description est requise',
            ar: 'الوصف مطلوب'
        },
        maxLength: {
            en: 'Description cannot exceed 255 characters',
            fr: 'La description ne peut pas dépasser 255 caractères',
            ar: 'الوصف لا يمكن أن يتجاوز 255 حرف'
        }
    },
    email: {
        required: {
            en: 'Email is required',
            fr: 'L\'email est requis',
            ar: 'البريد الإلكتروني مطلوب'
        },
        invalid: {
            en: 'Please enter a valid email address',
            fr: 'Veuillez saisir une adresse email valide',
            ar: 'يرجى إدخال عنوان بريد إلكتروني صحيح'
        }
    }
}

// Helper function to get field validation message
export function getFieldValidationMessage(
    field: keyof typeof FieldValidationMessages,
    validationType: string,
    locale: Locale = 'fr'
): string {
    const fieldMessages = FieldValidationMessages[field]
    if (!fieldMessages) return 'Validation error'

    const typeMessages = fieldMessages[validationType as keyof typeof fieldMessages]
    if (!typeMessages) return 'Validation error'

    return typeMessages[locale] || typeMessages.fr || typeMessages.en || 'Validation error'
}