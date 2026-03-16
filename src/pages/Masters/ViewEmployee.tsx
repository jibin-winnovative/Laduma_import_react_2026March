import { useEffect, useState } from 'react';
import { X, Edit2, Mail, Phone, MapPin, User, Briefcase, Shield } from 'lucide-react';
import { employeesService } from '../../services/employeesService';
import { Employee } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ViewEmployeeProps {
  employeeId: number;
  onClose: () => void;
  onEdit?: () => void;
  userPermissions?: string[];
}

export const ViewEmployee = ({
  employeeId,
  onClose,
  onEdit,
  userPermissions = [],
}: ViewEmployeeProps) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeesService.getById(employeeId);
      setEmployee(data);
    } catch (err) {
      console.error('Failed to fetch employee:', err);
      setError('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const hasEditPermission = () => {
    return userPermissions.includes('Employee.Update') || userPermissions.includes('Employee.Edit');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A57]"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-8">
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">{error || 'No record found'}</p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div
            className="border-b border-gray-200 px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0"
            style={{ backgroundColor: '#1B3A57' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Employee Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Detailed profile of employee record
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasEditPermission() && onEdit && (
                  <Button
                    onClick={onEdit}
                    className="bg-[#F2B705] hover:bg-[#d9a504] text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-[#1B3A57] to-[#2a5278] rounded-lg">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                    {employee.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1">
                    {employee.employeeCode}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${
                      employee.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1B3A57]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#1B3A57]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Role</p>
                      <p className="text-sm sm:text-base font-semibold text-[#1B3A57] mt-1 truncate">
                        {employee.roleName || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F2B705]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-[#F2B705]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Designation</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1 truncate">
                        {employee.designation || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Email</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1 truncate">
                        {employee.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Contact No</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1 truncate">
                        {employee.contactNo || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {employee.location && (
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Location</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1 truncate">
                          {employee.location}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {employee.address && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1B3A57]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#1B3A57]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2">Address</p>
                      <p className="text-sm sm:text-base text-gray-900 leading-relaxed break-words">
                        {employee.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(employee.createdDate || employee.modifiedDate) && (
                <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4">
                    Record Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {employee.createdDate && (
                      <div>
                        <p className="text-xs text-gray-600">Created Date</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 mt-1">
                          {new Date(employee.createdDate).toLocaleString()}
                        </p>
                        {employee.createdBy && (
                          <p className="text-xs text-gray-500 mt-1">By {employee.createdBy}</p>
                        )}
                      </div>
                    )}
                    {employee.modifiedDate && (
                      <div>
                        <p className="text-xs text-gray-600">Last Modified</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 mt-1">
                          {new Date(employee.modifiedDate).toLocaleString()}
                        </p>
                        {employee.modifiedBy && (
                          <p className="text-xs text-gray-500 mt-1">By {employee.modifiedBy}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex-shrink-0">
            <div className="flex items-center justify-end">
              <Button
                onClick={onClose}
                variant="outline"
                className="px-4 sm:px-6 text-sm sm:text-base"
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
