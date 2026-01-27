import { useRef, useEffect, useState } from 'react';

interface Props {
  content: string;
  width: number;
  height: number;
  onChange: (content: string) => void;
  onComplete: () => void;
}

export function NodeEditor({ content, width, height, onChange, onComplete }: Props) {
  const [value, setValue] = useState(content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onChange(value);
      onComplete();
      e.stopPropagation();
    } else if (e.key === 'Enter') {
      onChange(value);
      onComplete();
      e.stopPropagation();
    }
  };

  const handleBlur = () => {
    onChange(value);
    onComplete();
  };

  return (
    <foreignObject x={4} y={4} width={width - 8} height={height - 8}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full h-full px-2 text-sm border-none outline-none bg-transparent"
        style={{ fontSize: '14px' }}
      />
    </foreignObject>
  );
}
