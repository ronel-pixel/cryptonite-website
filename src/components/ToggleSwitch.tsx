import type { FC } from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const ToggleSwitch: FC<ToggleSwitchProps> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`toggle-switch ${checked ? 'toggle-switch--on' : ''}`}
      aria-pressed={checked}
    >
      <span className="toggle-switch__thumb" />
    </button>
  );
};

export default ToggleSwitch;

