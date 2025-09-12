import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (isCtrlOrCmd) {
      switch (key) {
        case 'k':
          event.preventDefault();
          // Focus global search
          document.getElementById('global-search')?.focus();
          break;

        case 'n':
          event.preventDefault();
          navigate('/campaign/new');
          toast({
            title: 'Quick Action',
            description: 'Opening Campaign Builder...'
          });
          break;

        case 'e':
          event.preventDefault();
          // Trigger export action
          window.dispatchEvent(new CustomEvent('keyboard-export'));
          toast({
            title: 'Export',
            description: 'Export functionality triggered'
          });
          break;

        case '1':
          event.preventDefault();
          navigate('/');
          break;

        case '2':
          event.preventDefault();
          navigate('/playlists');
          break;

        case '3':
          event.preventDefault();
          navigate('/campaigns');
          break;

        case '4':
          event.preventDefault();
          navigate('/clients');
          break;

        case '5':
          event.preventDefault();
          navigate('/reports');
          break;

        case 'p':
          event.preventDefault();
          navigate('/payments');
          break;

        case 't':
          event.preventDefault();
          navigate('/team-goals');
          break;

        case 'm':
          event.preventDefault();
          navigate('/ml-dashboard');
          break;

        case 'u':
          event.preventDefault();
          navigate('/users');
          break;

        case 'h':
          event.preventDefault();
          // Trigger help
          window.dispatchEvent(new CustomEvent('keyboard-help'));
          break;

        case '/':
          event.preventDefault();
          // Show keyboard shortcuts modal
          window.dispatchEvent(new CustomEvent('show-shortcuts'));
          break;
      }
    }

    // Non-modifier shortcuts
    switch (key) {
      case 'escape':
        // Close modals, dropdowns, etc.
        window.dispatchEvent(new CustomEvent('escape-pressed'));
        break;

      case '?':
        if (event.shiftKey) {
          event.preventDefault();
          // Show help
          window.dispatchEvent(new CustomEvent('show-shortcuts'));
        }
        break;
    }
  }, [navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return null;
};

export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Open global search' },
  { keys: ['Ctrl', 'N'], description: 'Create new campaign' },
  { keys: ['Ctrl', 'E'], description: 'Export current data' },
  { keys: ['Ctrl', '1'], description: 'Go to Dashboard' },
  { keys: ['Ctrl', '2'], description: 'Go to Vendors & Playlists' },
  { keys: ['Ctrl', '3'], description: 'Go to Campaigns' },
  { keys: ['Ctrl', '4'], description: 'Go to Clients' },
  { keys: ['Ctrl', '5'], description: 'Go to Reports' },
  { keys: ['Ctrl', 'P'], description: 'Go to Payments' },
  { keys: ['Ctrl', 'T'], description: 'Go to Team Goals' },
  { keys: ['Ctrl', 'M'], description: 'Go to ML Dashboard' },
  { keys: ['Ctrl', 'U'], description: 'Go to User Management' },
  { keys: ['Ctrl', 'H'], description: 'Show help' },
  { keys: ['Ctrl', '/'], description: 'Show shortcuts' },
  { keys: ['Shift', '?'], description: 'Show shortcuts' },
  { keys: ['Esc'], description: 'Close modals/dropdowns' },
];

// Helper functions for components to register keyboard actions
export const registerKeyboardHandler = (event: string, handler: () => void) => {
  window.addEventListener(event, handler);
  return () => window.removeEventListener(event, handler);
};

export const triggerKeyboardEvent = (event: string, data?: any) => {
  window.dispatchEvent(new CustomEvent(event, { detail: data }));
};