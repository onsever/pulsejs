import { handleBoostedLink } from './links';
import { handleBoostedForm } from './forms';

export function setupBoost(): () => void {
  document.addEventListener('click', handleBoostedLink);
  document.addEventListener('submit', handleBoostedForm);

  return () => {
    document.removeEventListener('click', handleBoostedLink);
    document.removeEventListener('submit', handleBoostedForm);
  };
}
