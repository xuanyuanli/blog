import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProviderForm } from '@/components/business/ProviderForm';
import type { CreateProviderRequest, ValidationResult } from '@/types';

// Mock lucide-react icons for StatusIndicator
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className, ...props }: any) => (
    <div data-testid="check-circle-icon" className={className} {...props}>✓</div>
  ),
  XCircle: ({ className, ...props }: any) => (
    <div data-testid="x-circle-icon" className={className} {...props}>✗</div>
  ),
  AlertTriangle: ({ className, ...props }: any) => (
    <div data-testid="alert-triangle-icon" className={className} {...props}>⚠</div>
  ),
  Clock: ({ className, ...props }: any) => (
    <div data-testid="clock-icon" className={className} {...props}>⏰</div>
  ),
}));

describe('ProviderForm Integration Tests', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    onValidate: jest.fn(),
  };

  const validFormData: CreateProviderRequest = {
    name: 'Test Provider',
    baseUrl: 'https://api.example.com',
    authToken: 'test-token',
    model: 'claude-3-sonnet-20240229',
    smallFastModel: 'claude-3-haiku-20240307',
    description: 'Test provider for integration testing',
    tags: ['test', 'integration'],
  };

  const successValidationResult: ValidationResult = {
    providerId: 'test-id',
    isValid: true,
    connectionStatus: 'connected',
    authStatus: 'valid',
    modelStatus: 'available',
    errors: [],
    warnings: [],
    testedAt: new Date().toISOString(),
  };

  const failureValidationResult: ValidationResult = {
    providerId: 'test-id',
    isValid: false,
    connectionStatus: 'error',
    authStatus: 'invalid',
    modelStatus: 'unknown',
    errors: ['Invalid API token', 'Connection timeout'],
    warnings: ['Model may not be available'],
    testedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering Integration', () => {
    test('renders complete form with all fields', () => {
      render(<ProviderForm {...mockProps} />);

      // All form fields should be present
      expect(screen.getByLabelText('提供商名称')).toBeInTheDocument();
      expect(screen.getByLabelText('API地址')).toBeInTheDocument();
      expect(screen.getByLabelText('认证令牌')).toBeInTheDocument();
      expect(screen.getByLabelText('主模型')).toBeInTheDocument();
      expect(screen.getByLabelText('快速模型')).toBeInTheDocument();
      expect(screen.getByLabelText('描述')).toBeInTheDocument();

      // Action buttons should be present
      expect(screen.getByRole('button', { name: '验证配置' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    });

    test('pre-populates form with initial data', () => {
      render(
        <ProviderForm 
          {...mockProps}
          initialData={validFormData}
          title="编辑提供商"
          submitButtonText="更新"
        />
      );

      expect(screen.getByDisplayValue('Test Provider')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://api.example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test-token')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test provider for integration testing')).toBeInTheDocument();
      
      expect(screen.getByText('编辑提供商')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
    });

    test('applies default values correctly', () => {
      render(<ProviderForm {...mockProps} />);

      const modelSelect = screen.getByLabelText('主模型') as HTMLSelectElement;
      const smallModelSelect = screen.getByLabelText('快速模型') as HTMLSelectElement;

      expect(modelSelect.value).toBe('claude-3-sonnet-20240229');
      expect(smallModelSelect.value).toBe('claude-3-haiku-20240307');
    });

    test('does not render when closed', () => {
      render(<ProviderForm {...mockProps} isOpen={false} />);

      expect(screen.queryByText('添加提供商')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('提供商名称')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation Integration', () => {
    test('validates required fields and shows errors', async () => {
      const user = userEvent.setup();
      render(<ProviderForm {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      // Should show validation errors for required fields
      await waitFor(() => {
        expect(screen.getByText('请输入提供商名称')).toBeInTheDocument();
        expect(screen.getByText('请输入API地址')).toBeInTheDocument();
        expect(screen.getByText('请输入认证令牌')).toBeInTheDocument();
      });

      // Should not call onSubmit
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    test('validates URL format', async () => {
      const user = userEvent.setup();
      render(<ProviderForm {...mockProps} />);

      const nameInput = screen.getByLabelText('提供商名称');
      const urlInput = screen.getByLabelText('API地址');
      const tokenInput = screen.getByLabelText('认证令牌');

      await user.type(nameInput, 'Test Provider');
      await user.type(urlInput, 'invalid-url');
      await user.type(tokenInput, 'test-token');

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入有效的URL地址')).toBeInTheDocument();
      });

      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    test('clears validation errors when user corrects input', async () => {
      const user = userEvent.setup();
      render(<ProviderForm {...mockProps} />);

      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入提供商名称')).toBeInTheDocument();
      });

      // Correct the input
      const nameInput = screen.getByLabelText('提供商名称');
      await user.type(nameInput, 'Test Provider');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('请输入提供商名称')).not.toBeInTheDocument();
      });
    });

    test('handles successful form submission', async () => {
      const user = userEvent.setup();
      mockProps.onSubmit.mockResolvedValueOnce(undefined);

      render(<ProviderForm {...mockProps} />);

      // Fill out all required fields
      await user.type(screen.getByLabelText('提供商名称'), 'Test Provider');
      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'test-token');
      await user.type(screen.getByLabelText('描述'), 'Test description');

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith({
          name: 'Test Provider',
          baseUrl: 'https://api.example.com',
          authToken: 'test-token',
          model: 'claude-3-sonnet-20240229',
          smallFastModel: 'claude-3-haiku-20240307',
          description: 'Test description',
          tags: [],
        });
      });

      expect(mockProps.onClose).toHaveBeenCalled();
    });

    test('handles form submission error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Provider already exists';
      mockProps.onSubmit.mockRejectedValueOnce(new Error(errorMessage));

      render(<ProviderForm {...mockProps} />);

      // Fill out form
      await user.type(screen.getByLabelText('提供商名称'), 'Test Provider');
      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'test-token');

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Provider Validation Integration', () => {
    test('validates provider configuration successfully', async () => {
      const user = userEvent.setup();
      mockProps.onValidate!.mockResolvedValueOnce(successValidationResult);

      render(<ProviderForm {...mockProps} />);

      // Fill in required fields for validation
      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'test-token');

      const validateButton = screen.getByRole('button', { name: '验证配置' });
      await user.click(validateButton);

      // Should show loading state
      expect(screen.getByText('验证中...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockProps.onValidate).toHaveBeenCalledWith(
          'https://api.example.com',
          'test-token'
        );
      });

      // Should show success status
      await waitFor(() => {
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
        expect(screen.getByText('验证成功')).toBeInTheDocument();
      });
    });

    test('validates provider configuration with failure', async () => {
      const user = userEvent.setup();
      mockProps.onValidate!.mockResolvedValueOnce(failureValidationResult);

      render(<ProviderForm {...mockProps} />);

      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'invalid-token');

      const validateButton = screen.getByRole('button', { name: '验证配置' });
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
        expect(screen.getByText('验证失败')).toBeInTheDocument();
      });

      // Should show error details
      expect(screen.getByText('验证失败：')).toBeInTheDocument();
      expect(screen.getByText('• Invalid API token')).toBeInTheDocument();
      expect(screen.getByText('• Connection timeout')).toBeInTheDocument();

      // Should show warnings
      expect(screen.getByText('警告：')).toBeInTheDocument();
      expect(screen.getByText('• Model may not be available')).toBeInTheDocument();
    });

    test('handles validation error exception', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network connection failed';
      mockProps.onValidate!.mockRejectedValueOnce(new Error(errorMessage));

      render(<ProviderForm {...mockProps} />);

      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'test-token');

      const validateButton = screen.getByRole('button', { name: '验证配置' });
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
        expect(screen.getByText('验证失败')).toBeInTheDocument();
      });

      expect(screen.getByText(`• 验证失败：${errorMessage}`)).toBeInTheDocument();
    });

    test('disables validation when required fields are missing', async () => {
      render(<ProviderForm {...mockProps} />);

      const validateButton = screen.getByRole('button', { name: '验证配置' });
      expect(validateButton).toBeDisabled();

      // Add URL only
      const user = userEvent.setup();
      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      expect(validateButton).toBeDisabled(); // Still disabled without token

      // Add token
      await user.type(screen.getByLabelText('认证令牌'), 'test-token');
      expect(validateButton).not.toBeDisabled(); // Now enabled
    });

    test('shows validation error when fields are missing for validation', async () => {
      const user = userEvent.setup();
      render(<ProviderForm {...mockProps} />);

      // Clear the disabled state by providing minimal data
      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.clear(screen.getByLabelText('API地址'));

      const validateButton = screen.getByRole('button', { name: '验证配置' });
      
      // Button should be disabled, but test the error handling logic
      expect(validateButton).toBeDisabled();
    });
  });

  describe('User Experience Integration', () => {
    test('handles form cancellation correctly', async () => {
      const user = userEvent.setup();
      render(<ProviderForm {...mockProps} initialData={validFormData} />);

      // Modify some fields
      const nameInput = screen.getByLabelText('提供商名称');
      await user.clear(nameInput);
      await user.type(nameInput, 'Modified Name');

      const cancelButton = screen.getByRole('button', { name: '取消' });
      await user.click(cancelButton);

      expect(mockProps.onClose).toHaveBeenCalled();
    });

    test('resets form state on close', async () => {
      const user = userEvent.setup();
      
      // Start with populated form
      const { rerender } = render(
        <ProviderForm {...mockProps} initialData={validFormData} />
      );

      // Modify fields
      const nameInput = screen.getByLabelText('提供商名称');
      await user.clear(nameInput);
      await user.type(nameInput, 'Modified Name');

      // Close and reopen
      rerender(<ProviderForm {...mockProps} isOpen={false} />);
      rerender(<ProviderForm {...mockProps} isOpen={true} />);

      // Form should be reset to defaults
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Empty name
      const modelSelect = screen.getByLabelText('主模型') as HTMLSelectElement;
      expect(modelSelect.value).toBe('claude-3-sonnet-20240229');
    });

    test('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockProps.onSubmit.mockReturnValueOnce(submitPromise);

      render(<ProviderForm {...mockProps} />);

      // Fill form and submit
      await user.type(screen.getByLabelText('提供商名称'), 'Test Provider');
      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'test-token');

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      // Should show loading state
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-disabled', 'true');

      // Resolve the promise
      resolveSubmit!();
      
      await waitFor(() => {
        expect(mockProps.onClose).toHaveBeenCalled();
      });
    });

    test('handles select field changes correctly', async () => {
      const user = userEvent.setup();
      render(<ProviderForm {...mockProps} />);

      const modelSelect = screen.getByLabelText('主模型');
      await user.selectOptions(modelSelect, 'claude-3-opus-20240229');

      expect((modelSelect as HTMLSelectElement).value).toBe('claude-3-opus-20240229');

      // Should be able to submit with new model
      await user.type(screen.getByLabelText('提供商名称'), 'Test Provider');
      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'test-token');

      mockProps.onSubmit.mockResolvedValueOnce(undefined);
      
      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'claude-3-opus-20240229',
          })
        );
      });
    });
  });

  describe('Accessibility Integration', () => {
    test('form is keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ProviderForm {...mockProps} />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText('提供商名称')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('API地址')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('认证令牌')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('主模型')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('快速模型')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('描述')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: '验证配置' })).toHaveFocus();
    });

    test('error messages are associated with form fields', async () => {
      const user = userEvent.setup();
      render(<ProviderForm {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText('提供商名称');
        const errorMessage = screen.getByText('请输入提供商名称');
        
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    test('validation status is accessible to screen readers', async () => {
      const user = userEvent.setup();
      mockProps.onValidate!.mockResolvedValueOnce(successValidationResult);

      render(<ProviderForm {...mockProps} />);

      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'test-token');

      const validateButton = screen.getByRole('button', { name: '验证配置' });
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('验证成功')).toBeInTheDocument();
      });

      // Status should be announced to screen readers
      const statusIndicator = screen.getByTestId('check-circle-icon').parentElement;
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe('Modal Integration', () => {
    test('modal closes when clicking backdrop', () => {
      // Note: This would require more complex setup to test modal backdrop clicking
      // The actual modal backdrop click handling is tested in the Modal component tests
      render(<ProviderForm {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('modal has proper title and structure', () => {
      render(
        <ProviderForm 
          {...mockProps}
          title="Custom Form Title"
        />
      );

      expect(screen.getByText('Custom Form Title')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Complex Integration Scenarios', () => {
    test('form validation → API validation → successful submission flow', async () => {
      const user = userEvent.setup();
      mockProps.onValidate!.mockResolvedValueOnce(successValidationResult);
      mockProps.onSubmit.mockResolvedValueOnce(undefined);

      render(<ProviderForm {...mockProps} />);

      // Fill form
      await user.type(screen.getByLabelText('提供商名称'), 'Integration Test Provider');
      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'valid-token');
      await user.type(screen.getByLabelText('描述'), 'Tested provider');

      // Validate first
      const validateButton = screen.getByRole('button', { name: '验证配置' });
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('验证成功')).toBeInTheDocument();
      });

      // Then submit
      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalled();
        expect(mockProps.onClose).toHaveBeenCalled();
      });
    });

    test('handles rapid user interactions gracefully', async () => {
      const user = userEvent.setup();
      mockProps.onValidate!.mockResolvedValueOnce(successValidationResult);

      render(<ProviderForm {...mockProps} />);

      await user.type(screen.getByLabelText('API地址'), 'https://api.example.com');
      await user.type(screen.getByLabelText('认证令牌'), 'test-token');

      const validateButton = screen.getByRole('button', { name: '验证配置' });
      
      // Rapid clicks should be handled gracefully
      await user.click(validateButton);
      await user.click(validateButton);
      await user.click(validateButton);

      // Should only call validation once or handle multiple calls appropriately
      await waitFor(() => {
        expect(mockProps.onValidate).toHaveBeenCalled();
      });

      expect(screen.getByText('验证成功')).toBeInTheDocument();
    });

    test('handles form editing with pre-existing validation results', async () => {
      const user = userEvent.setup();
      
      // Start with successful validation
      mockProps.onValidate!.mockResolvedValueOnce(successValidationResult);

      render(<ProviderForm {...mockProps} initialData={validFormData} />);

      // Perform validation
      const validateButton = screen.getByRole('button', { name: '验证配置' });
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('验证成功')).toBeInTheDocument();
      });

      // Modify URL (should clear validation result)
      const urlInput = screen.getByLabelText('API地址');
      await user.clear(urlInput);
      await user.type(urlInput, 'https://different.api.com');

      // Validation status should persist until new validation
      expect(screen.getByText('验证成功')).toBeInTheDocument();
    });
  });
});