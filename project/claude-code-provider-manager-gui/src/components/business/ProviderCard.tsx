import React from 'react';
import { Edit2, Trash2, Zap, MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardContent, CardActions } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import type { Provider } from '@/types';

interface ProviderCardProps {
  provider: Provider;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
  onValidate: (id: string) => void;
  isActive?: boolean;
  className?: string;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onEdit,
  onDelete,
  onActivate,
  onValidate,
  isActive = false,
  className = '',
}) => {
  const getStatusType = () => {
    if (provider.isActive) return 'success';
    if (provider.isValid === false) return 'error';
    if (provider.isValid === undefined) return 'unknown';
    return 'success';
  };

  const getStatusText = () => {
    if (isActive) return '已激活';
    if (provider.isValid === false) return '验证失败';
    if (provider.isValid === undefined) return '未验证';
    return '可用';
  };

  const handleValidate = () => {
    onValidate(provider.id);
  };

  return (
    <Card className={`transition-all hover:shadow-lg ${isActive ? 'ring-2 ring-blue-500' : ''} ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
            <StatusIndicator 
              status={getStatusType()} 
              text={getStatusText()}
              size="sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            {isActive && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-medium">当前激活</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              className="p-1"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">URL:</span>
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {provider.baseUrl}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">模型:</span>
            <span>{provider.model}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">快速模型:</span>
            <span>{provider.smallFastModel}</span>
          </div>
          {provider.description && (
            <p className="text-sm text-gray-500 mt-2">
              {provider.description}
            </p>
          )}
          {provider.tags && provider.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {provider.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardActions>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleValidate}
            >
              验证
            </Button>
            {!isActive && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onActivate(provider.id)}
              >
                激活
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(provider.id)}
              className="p-2"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(provider.id)}
              className="p-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardActions>
    </Card>
  );
};