/**
 * Utility functions to fix common UI interactivity issues
 */

// Fix for buttons that don't respond to clicks
export const ensureButtonInteractivity = () => {
  // Add event listeners to ensure buttons work
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button[disabled="false"], button:not([disabled])');
    buttons.forEach(button => {
      if (!button.hasAttribute('data-interactive-fixed')) {
        const buttonElement = button as HTMLElement;
        buttonElement.style.pointerEvents = 'auto';
        buttonElement.style.cursor = 'pointer';
        button.setAttribute('data-interactive-fixed', 'true');
      }
    });
  });
};

// Fix for form elements that don't respond
export const ensureFormInteractivity = () => {
  document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.hasAttribute('data-interactive-fixed')) {
        const inputElement = input as HTMLElement;
        inputElement.style.pointerEvents = 'auto';
        input.setAttribute('data-interactive-fixed', 'true');
      }
    });
  });
};

// Fix for dropdown and modal elements
export const ensureDropdownInteractivity = () => {
  // Ensure dropdowns have proper z-index and pointer events
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Fix dropdown content
          if (element.matches('[role="menu"], [role="listbox"], .dropdown-content')) {
            (element as HTMLElement).style.pointerEvents = 'auto';
            (element as HTMLElement).style.zIndex = '1000';
          }
          
          // Fix modal/dialog content
          if (element.matches('[role="dialog"], .modal-content')) {
            (element as HTMLElement).style.pointerEvents = 'auto';
          }
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
};

// Initialize all fixes
export const initializeInteractivityFixes = () => {
  ensureButtonInteractivity();
  ensureFormInteractivity();
  ensureDropdownInteractivity();
  
  // Re-run fixes periodically to catch dynamic content
  setInterval(() => {
    ensureButtonInteractivity();
    ensureFormInteractivity();
  }, 2000);
};