import { useToastStore } from '../../hooks/useToast';

export default function Toast() {
  const { message, visible } = useToastStore();
  return (
    <div id="toast" className={visible ? 'show' : ''}>
      {message}
    </div>
  );
}
