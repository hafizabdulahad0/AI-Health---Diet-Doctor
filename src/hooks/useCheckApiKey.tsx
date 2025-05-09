
import { useState } from 'react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { ApiKeyModal } from '@/components/ApiKeyModal';

export function useCheckApiKey() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasKey } = useApiKey();

  const openApiKeyModal = () => {
    setIsModalOpen(true);
  };
  
  const closeApiKeyModal = () => {
    setIsModalOpen(false);
  };
  
  return {
    isApiKeyModalOpen: isModalOpen,
    closeApiKeyModal,
    openApiKeyModal,
    ApiKeyModalComponent: isModalOpen ? <ApiKeyModal isOpen={isModalOpen} onClose={closeApiKeyModal} /> : null,
  };
}
