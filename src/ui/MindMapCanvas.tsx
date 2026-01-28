import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNodeStore } from '../stores';
import { calculateLayout } from '../layout/hierarchicalLayout';
import { MindMapNodeComponent } from './MindMapNode';
import { MindMapEdge } from './MindMapEdge';

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function MindMapCanvas() {
  const nodes = useNodeStore((state) => state.nodes);
  const selectedNodeId = useNodeStore((state) => state.selectedNodeId);
  const setFitToView = useNodeStore((state) => state.setFitToView);

  const layout = useMemo(() => calculateLayout(nodes), [nodes]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const mouseViewX = viewBox.x + (mouseX / rect.width) * viewBox.width;
      const mouseViewY = viewBox.y + (mouseY / rect.height) * viewBox.height;

      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const newWidth = viewBox.width * zoomFactor;
      const newHeight = viewBox.height * zoomFactor;

      const newX = mouseViewX - (mouseX / rect.width) * newWidth;
      const newY = mouseViewY - (mouseY / rect.height) * newHeight;

      setViewBox({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    },
    [viewBox]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dx = ((e.clientX - panStart.x) / rect.width) * viewBox.width;
      const dy = ((e.clientY - panStart.y) / rect.height) * viewBox.height;

      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy,
      }));

      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, panStart, viewBox.width, viewBox.height]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  const fitToView = useCallback(() => {
    if (layout.bounds.width === 0 || layout.bounds.height === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const containerAspect = rect.width / rect.height;
    const boundsAspect = layout.bounds.width / layout.bounds.height;

    const padding = 50;
    let newWidth: number;
    let newHeight: number;

    if (boundsAspect > containerAspect) {
      newWidth = layout.bounds.width + padding * 2;
      newHeight = newWidth / containerAspect;
    } else {
      newHeight = layout.bounds.height + padding * 2;
      newWidth = newHeight * containerAspect;
    }

    const contentCenterX = layout.bounds.width / 2;
    const contentCenterY = layout.bounds.height / 2;
    const newX = contentCenterX - newWidth / 2;
    const newY = contentCenterY - newHeight / 2;

    setViewBox({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  }, [layout.bounds]);

  useEffect(() => {
    setFitToView(fitToView);
  }, [fitToView, setFitToView]);

  if (nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden bg-gray-50 flex items-center justify-center"
      >
        <div className="text-center text-gray-500 max-w-md px-8">
          <div className="text-6xl mb-6">🧠</div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Welcome to Mind Map</h2>
          <p className="mb-6 leading-relaxed">
            A keyboard-first mind mapping tool with vim-like navigation.
          </p>
          <div className="text-left bg-white rounded-lg p-4 shadow-sm border">
            <p className="font-medium mb-2 text-gray-700">Quick Start:</p>
            <ul className="space-y-1 text-sm">
              <li>
                <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">a</kbd> - Create
                your first node
              </li>
              <li>
                <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">i</kbd> - Edit
                node content
              </li>
              <li>
                <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">h/j/k/l</kbd> -
                Navigate (vim-style)
              </li>
              <li>
                <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">Cmd+K</kbd> -
                Command palette
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <svg
        className="w-full h-full bg-gray-50"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g className="edges">
          {layout.edges.map((edge) => (
            <MindMapEdge key={`${edge.fromId}-${edge.toId}`} edge={edge} />
          ))}
        </g>
        <g className="nodes">
          {Array.from(layout.nodes.entries()).map(([nodeId, nodeLayout]) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (!node) return null;
            return (
              <MindMapNodeComponent
                key={nodeId}
                node={node}
                layout={nodeLayout}
                isSelected={nodeId === selectedNodeId}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
