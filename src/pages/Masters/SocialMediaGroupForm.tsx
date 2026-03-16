import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { socialMediaGroupsService, SocialMediaGroup } from '../../services/socialMediaGroupsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const SOCIAL_MEDIA_OPTIONS = [
  'WhatsApp',
  'WeChat',
  'LinkedIn',
  'Instagram',
  'Snapchat',
  'Telegram',
  'Facebook',
];

const socialMediaGroupSchema = z.object({
  socialMediaGroupId: z.number().optional(),
  groupName: z
    .string()
    .min(1, 'Group Name is required')
    .max(200, 'Group Name must be 200 characters or less'),
  socialMedia: z
    .string()
    .min(1, 'Social Media is required'),
  contactPerson: z
    .string()
    .min(1, 'Contact Person is required')
    .max(100, 'Contact Person must be 100 characters or less'),
  contactNo: z
    .string()
    .refine((val) => !val || /^\+?[0-9\s-]{8,20}$/.test(val), 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  idNumber: z
    .string()
    .max(50, 'ID Number must be 50 characters or less')
    .optional()
    .or(z.literal('')),
  emailId: z
    .string()
    .email('Invalid email format')
    .max(100, 'Email must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean(),
});

type SocialMediaGroupFormData = z.infer<typeof socialMediaGroupSchema>;

interface SocialMediaGroupFormProps {
  mode: 'add' | 'edit';
  groupId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SocialMediaGroupForm = ({ mode, groupId, onClose, onSuccess }: SocialMediaGroupFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<SocialMediaGroupFormData>({
    resolver: zodResolver(socialMediaGroupSchema),
    mode: 'onBlur',
    defaultValues: {
      isActive: true,
      groupName: '',
      socialMedia: '',
      contactPerson: '',
      contactNo: '',
      idNumber: '',
      emailId: '',
    },
  });

  const groupName = watch('groupName');
  const socialMedia = watch('socialMedia');

  useEffect(() => {
    if (mode === 'edit' && groupId) {
      fetchGroupData();
    }
  }, [mode, groupId]);

  useEffect(() => {
    if (groupName && socialMedia && groupName.length > 0) {
      const timer = setTimeout(() => {
        checkDuplicateGroup(groupName, socialMedia);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('groupName');
    }
  }, [groupName, socialMedia]);

  const fetchGroupData = async () => {
    if (!groupId) return;

    setInitialLoading(true);
    try {
      const group = await socialMediaGroupsService.getById(groupId);
      setValue('groupName', group.groupName);
      setValue('socialMedia', group.socialMedia);
      setValue('contactPerson', group.contactPerson);
      setValue('contactNo', group.contactNo || '');
      setValue('idNumber', group.idNumber || '');
      setValue('emailId', group.emailId || '');
      setValue('isActive', group.isActive);
    } catch (error) {
      console.error('Failed to fetch group data:', error);
      alert('Failed to load group data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkDuplicateGroup = async (name: string, media: string) => {
    if (!name || !media) return;

    setCheckingDuplicate(true);
    clearErrors('groupName');

    try {
      const exists = await socialMediaGroupsService.checkExists(
        name,
        media,
        mode === 'edit' ? groupId : undefined
      );

      if (exists) {
        setError('groupName', {
          type: 'manual',
          message: 'This group name already exists for the selected social media platform'
        });
      }
    } catch (error) {
      console.error('Failed to check duplicate:', error);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const onSubmit = async (data: SocialMediaGroupFormData) => {
    if (errors.groupName) {
      return;
    }

    if (checkingDuplicate) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        groupName: data.groupName,
        socialMedia: data.socialMedia,
        contactPerson: data.contactPerson,
        contactNo: data.contactNo || null,
        idNumber: data.idNumber || null,
        emailId: data.emailId || null,
        isActive: data.isActive,
      };

      if (mode === 'add') {
        await socialMediaGroupsService.create(payload);
        alert('Social Media Group created successfully!');
      } else if (mode === 'edit' && groupId) {
        await socialMediaGroupsService.update(groupId, payload);
        alert('Social Media Group updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save group:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save social media group';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-3xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  {mode === 'add' ? 'Add New Social Media Group' : 'Edit Social Media Group'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add'
                    ? 'Create a new social media group record'
                    : 'Update social media group information'}
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="secondary"
                className="bg-gray-600 hover:bg-gray-700 text-white flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 md:p-8" style={{ backgroundColor: '#F9FAFB' }}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Group Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('groupName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter group name"
                          autoFocus
                        />
                        {checkingDuplicate && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                          </div>
                        )}
                      </div>
                      {errors.groupName && (
                        <p className="text-red-500 text-sm mt-1">{errors.groupName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Social Media <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('socialMedia')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                      >
                        <option value="">Select social media</option>
                        {SOCIAL_MEDIA_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.socialMedia && (
                        <p className="text-red-500 text-sm mt-1">{errors.socialMedia.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Contact Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('contactPerson')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter contact person name"
                      />
                      {errors.contactPerson && (
                        <p className="text-red-500 text-sm mt-1">{errors.contactPerson.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact No
                        </label>
                        <input
                          type="text"
                          {...register('contactNo')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="+1234567890"
                        />
                        {errors.contactNo && (
                          <p className="text-red-500 text-sm mt-1">{errors.contactNo.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ID Number
                        </label>
                        <input
                          type="text"
                          {...register('idNumber')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter ID number"
                        />
                        {errors.idNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.idNumber.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Id
                      </label>
                      <input
                        type="email"
                        {...register('emailId')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="email@example.com"
                      />
                      {errors.emailId && (
                        <p className="text-red-500 text-sm mt-1">{errors.emailId.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {mode === 'edit' && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Status
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                        <input
                          type="checkbox"
                          {...register('isActive')}
                          className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                        />
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">
                            Active Status
                          </label>
                          <p className="text-xs text-gray-500">
                            Enable this to make the group active
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-300">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || checkingDuplicate}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {mode === 'edit' ? 'Update' : 'Save'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};
