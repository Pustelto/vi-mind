import { useRef, useEffect, useState } from 'react';

interface Props {
  content: string;
  width: number;
  height: number;
  onChange: (content: string) => void;
  onComplete: (content: string) => void;
  onCancel?: () => void;
}

export function NodeEditor({ content, width, height, onChange, onComplete }: Props) {
  const [value, setValue] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  useEffect(() => {
    onChange(value);
  }, [value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onComplete(value);
      e.stopPropagation();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onComplete(value);
      e.stopPropagation();
    }
  };

  const handleBlur = () => {
    onComplete(value);
  };

  return (
    <foreignObject x={4} y={4} width={width - 8} height={height - 8}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full h-full px-2 py-1 text-sm border-none outline-none bg-white resize-none"
        style={{ fontSize: '14px', lineHeight: '1.4' }}
      />
    </foreignObject>
  );
}
