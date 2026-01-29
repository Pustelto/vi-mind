import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNodeStore, useUIStore } from '../stores';
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
  const setFocusNode = useNodeStore((state) => state.setFocusNode);
  const setPanCanvas = useNodeStore((state) => state.setPanCanvas);
  const setZoomCanvas = useNodeStore((state) => state.setZoomCanvas);
  const setExportAs = useNodeStore((state) => state.setExportAs);
  const mode = useUIStore((state) => state.mode);

  const layout = useMemo(() => calculateLayout(nodes), [nodes]);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const lastAutoPanRef = useRef<{ mode: string; nodeId: string | null }>({ mode: 'normal', nodeId: null });

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

    let newWidth: number;
    let newHeight: number;

    if (boundsAspect > containerAspect) {
      newWidth = layout.bounds.width;
      newHeight = newWidth / containerAspect;
    } else {
      newHeight = layout.bounds.height;
      newWidth = newHeight * containerAspect;
    }

    const contentCenterX = layout.bounds.minX + layout.bounds.width / 2;
    const contentCenterY = layout.bounds.minY + layout.bounds.height / 2;
    const newX = contentCenterX - newWidth / 2;
    const newY = contentCenterY - newHeight / 2;

    setViewBox({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  }, [layout.bounds]);

  const focusNode = useCallback(
    (nodeId: string) => {
      const nodeLayout = layout.nodes.get(nodeId);
      if (!nodeLayout) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerAspect = rect.width / rect.height;

      const padding = 150;
      const nodeWidth = nodeLayout.width + padding * 2;
      const nodeHeight = nodeLayout.height + padding * 2;
      const nodeAspect = nodeWidth / nodeHeight;

      let newWidth: number;
      let newHeight: number;

      if (nodeAspect > containerAspect) {
        newWidth = Math.max(nodeWidth, 400);
        newHeight = newWidth / containerAspect;
      } else {
        newHeight = Math.max(nodeHeight, 300);
        newWidth = newHeight * containerAspect;
      }

      const nodeCenterX = nodeLayout.position.x + nodeLayout.width / 2;
      const nodeCenterY = nodeLayout.position.y + nodeLayout.height / 2;

      setViewBox({
        x: nodeCenterX - newWidth / 2,
        y: nodeCenterY - newHeight / 2,
        width: newWidth,
        height: newHeight,
      });
    },
    [layout.nodes]
  );

  useEffect(() => {
    setFitToView(fitToView);
  }, [fitToView, setFitToView]);

  useEffect(() => {
    setFocusNode(focusNode);
  }, [focusNode, setFocusNode]);

  const panCanvas = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const panAmount = 100;
      setViewBox((prev) => {
        switch (direction) {
          case 'up':
            return { ...prev, y: prev.y - panAmount };
          case 'down':
            return { ...prev, y: prev.y + panAmount };
          case 'left':
            return { ...prev, x: prev.x - panAmount };
          case 'right':
            return { ...prev, x: prev.x + panAmount };
        }
      });
    },
    []
  );

  useEffect(() => {
    setPanCanvas(panCanvas);
  }, [panCanvas, setPanCanvas]);

  const zoomCanvas = useCallback(
    (direction: 'in' | 'out') => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = viewBox.x + viewBox.width / 2;
      const centerY = viewBox.y + viewBox.height / 2;

      const zoomFactor = direction === 'in' ? 0.8 : 1.25;
      const newWidth = viewBox.width * zoomFactor;
      const newHeight = (newWidth / rect.width) * rect.height;

      setViewBox({
        x: centerX - newWidth / 2,
        y: centerY - newHeight / 2,
        width: newWidth,
        height: newHeight,
      });
    },
    [viewBox]
  );

  useEffect(() => {
    setZoomCanvas(zoomCanvas);
  }, [zoomCanvas, setZoomCanvas]);

  const exportAs = useCallback(
    (format: 'svg' | 'png') => {
      const svg = svgRef.current;
      if (!svg) return;

      const padding = 40;
      const exportBounds = {
        minX: layout.bounds.minX - padding,
        minY: layout.bounds.minY - padding,
        width: layout.bounds.width + padding * 2,
        height: layout.bounds.height + padding * 2,
      };

      const svgClone = svg.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute('viewBox', `${exportBounds.minX} ${exportBounds.minY} ${exportBounds.width} ${exportBounds.height}`);
      svgClone.setAttribute('width', String(exportBounds.width));
      svgClone.setAttribute('height', String(exportBounds.height));
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgClone.style.backgroundColor = '#f9fafb';

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

      if (format === 'svg') {
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mindmap.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = exportBounds.width * scale;
        canvas.height = exportBounds.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(scale, scale);
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, exportBounds.width, exportBounds.height);

        const img = new Image();
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          canvas.toBlob((blob) => {
            if (!blob) return;
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = 'mindmap.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pngUrl);
          }, 'image/png');
        };
        img.src = url;
      }
    },
    [layout.bounds]
  );

  useEffect(() => {
    setExportAs(exportAs);
  }, [exportAs, setExportAs]);

  const panToNode = useCallback(
    (nodeId: string) => {
      const nodeLayout = layout.nodes.get(nodeId);
      if (!nodeLayout || !containerRef.current) return;

      setViewBox((prev) => {
        const padding = 100;
        const nodeLeft = nodeLayout.position.x;
        const nodeRight = nodeLayout.position.x + nodeLayout.width;
        const nodeTop = nodeLayout.position.y;
        const nodeBottom = nodeLayout.position.y + nodeLayout.height;

        const viewLeft = prev.x + padding;
        const viewRight = prev.x + prev.width - padding;
        const viewTop = prev.y + padding;
        const viewBottom = prev.y + prev.height - padding;

        let newX = prev.x;
        let newY = prev.y;

        if (nodeLeft < viewLeft) {
          newX = nodeLeft - padding;
        } else if (nodeRight > viewRight) {
          newX = nodeRight - prev.width + padding;
        }

        if (nodeTop < viewTop) {
          newY = nodeTop - padding;
        } else if (nodeBottom > viewBottom) {
          newY = nodeBottom - prev.height + padding;
        }

        if (newX !== prev.x || newY !== prev.y) {
          return { ...prev, x: newX, y: newY };
        }
        return prev;
      });
    },
    [layout.nodes]
  );

  useEffect(() => {
    const lastPan = lastAutoPanRef.current;
    if (mode === 'insert' && selectedNodeId && (lastPan.mode !== 'insert' || lastPan.nodeId !== selectedNodeId)) {
      lastAutoPanRef.current = { mode, nodeId: selectedNodeId };
      const frameId = requestAnimationFrame(() => panToNode(selectedNodeId));
      return () => cancelAnimationFrame(frameId);
    } else if (mode !== 'insert') {
      lastAutoPanRef.current = { mode, nodeId: null };
    }
  }, [mode, selectedNodeId, panToNode]);

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
        ref={svgRef}
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
