import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import type { CreateProviderRequest, Provider, ValidationResult } from '@/types';

interface ProviderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProviderRequest) => Promise<void>;
  onValidate?: (baseUrl: string, authToken: string) => Promise<ValidationResult>;
  initialData?: Partial<CreateProviderRequest>;
  title?: string;
  submitButtonText?: string;
}

const modelOptions = [
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  { value: 'claude-2.1', label: 'Claude 2.1' },
  { value: 'claude-instant-1.2', label: 'Claude Instant 1.2' },
];

const smallModelOptions = [
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  { value: 'claude-instant-1.2', label: 'Claude Instant 1.2' },
];

export const ProviderForm: React.FC<ProviderFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onValidate,
  initialData = {},
  title = '添加提供商',
  submitButtonText = '保存',
}) => {
  const [formData, setFormData] = useState<CreateProviderRequest>({
    name: initialData.name || '',
    baseUrl: initialData.baseUrl || '',
    authToken: initialData.authToken || '',
    model: initialData.model || 'claude-3-sonnet-20240229',
    smallFastModel: initialData.smallFastModel || 'claude-3-haiku-20240307',
    description: initialData.description || '',
    tags: initialData.tags || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入提供商名称';
    }

    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = '请输入API地址';
    } else if (!formData.baseUrl.startsWith('http')) {
      newErrors.baseUrl = '请输入有效的URL地址';
    }

    if (!formData.authToken.trim()) {
      newErrors.authToken = '请输入认证令牌';
    }

    if (!formData.model) {
      newErrors.model = '请选择主模型';
    }

    if (!formData.smallFastModel) {
      newErrors.smallFastModel = '请选择快速模型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateProviderRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleValidate = async () => {
    if (!formData.baseUrl || !formData.authToken) {
      setErrors(prev => ({
        ...prev,
        baseUrl: !formData.baseUrl ? '请输入API地址' : '',
        authToken: !formData.authToken ? '请输入认证令牌' : '',
      }));
      return;
    }

    if (!onValidate) return;

    setIsValidating(true);
    try {
      const result = await onValidate(formData.baseUrl, formData.authToken);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        providerId: 'temp',
        isValid: false,
        connectionStatus: 'error',
        authStatus: 'error',
        modelStatus: 'unknown',
        errors: ['验证失败：' + (error as Error).message],
        warnings: [],
        testedAt: new Date().toISOString(),
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: (error as Error).message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      baseUrl: '',
      authToken: '',
      model: 'claude-3-sonnet-20240229',
      smallFastModel: 'claude-3-haiku-20240307',
      description: '',
      tags: [],
    });
    setErrors({});
    setValidationResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="提供商名称"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          helperText="例如：Claude Official、自定义代理等"
          placeholder="输入提供商名称"
          required
        />

        <Input
          label="API地址"
          value={formData.baseUrl}
          onChange={(e) => handleInputChange('baseUrl', e.target.value)}
          error={errors.baseUrl}
          helperText="完整的API端点URL"
          placeholder="https://api.example.com"
          required
        />

        <Input
          label="认证令牌"
          type="password"
          value={formData.authToken}
          onChange={(e) => handleInputChange('authToken', e.target.value)}
          error={errors.authToken}
          helperText="API认证令牌（安全存储）"
          placeholder="输入认证令牌"
          required
        />

        <Select
          label="主模型"
          value={formData.model}
          onChange={(e) => handleInputChange('model', e.target.value)}
          error={errors.model}
          options={modelOptions}
          required
        />

        <Select
          label="快速模型"
          value={formData.smallFastModel}
          onChange={(e) => handleInputChange('smallFastModel', e.target.value)}
          error={errors.smallFastModel}
          options={smallModelOptions}
          required
        />

        <Input
          label="描述"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          helperText="可选的提供商描述"
          placeholder="输入描述信息"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleValidate}
              disabled={isValidating || !formData.baseUrl || !formData.authToken}
            >
              {isValidating ? '验证中...' : '验证配置'}
            </Button>
            
            {validationResult && (
              <StatusIndicator
                status={validationResult.isValid ? 'success' : 'error'}
                text={validationResult.isValid ? '验证成功' : '验证失败'}
                size="sm"
              />
            )}
          </div>
        </div>

        {validationResult && !validationResult.isValid && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-red-800 mb-2">验证失败：</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {validationResult.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
            {validationResult.warnings.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-yellow-800 mb-2 mt-3">警告：</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
          >
            取消
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};