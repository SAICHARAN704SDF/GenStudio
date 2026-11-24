import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CheckpointLoaderNode from './nodes/CheckpointLoaderNode';
import LoraLoaderNode from './nodes/LoraLoaderNode';
import RAGRetrieverNode from './nodes/RAGRetrieverNode';
import ClipTextEncodeNode from './nodes/ClipTextEncodeNode';
import ClipTextEncodeNegativeNode from './nodes/ClipTextEncodeNegativeNode';
import LatentInputNode from './nodes/LatentInputNode';
import KSamplerNode from './nodes/KSamplerNode';
import VaeDecodeNode from './nodes/VaeDecodeNode';
import SaveImageNode from './nodes/SaveImageNode';

const nodeTypes = {
  checkpoint: CheckpointLoaderNode,
  lora: LoraLoaderNode,
  rag: RAGRetrieverNode,
  prompt_pos: ClipTextEncodeNode,
  prompt_neg: ClipTextEncodeNegativeNode,
  latent: LatentInputNode,
  ksampler: KSamplerNode,
  vae_decode: VaeDecodeNode,
  save_image: SaveImageNode,
};

export default function ComfyFlow({
  mode,
  setMode,
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  initImage,
  setInitImage,
  strength,
  setStrength,
  slerpSeedA,
  setSlerpSeedA,
  slerpSeedB,
  setSlerpSeedB,
  steps,
  setSteps,
  seed,
  setSeed,
  loraPath,
  setLoraPath,
  loraScale,
  setLoraScale,
  enhancedData,
  onEnhance,
  isEnhancing,
  onApplyEnhanced,
  result,
  slerpResult,
  isGenerating,
  onCritiqueAndRefine,
  isCritiquing,
  criticReport,
  activeNode,
  completedNodes,
  onNodeClick,
}) {
  // Shared data passed to node callbacks
  const sharedData = useMemo(() => ({
    mode,
    setMode,
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    initImage,
    setInitImage,
    strength,
    setStrength,
    slerpSeedA,
    setSlerpSeedA,
    slerpSeedB,
    setSlerpSeedB,
    steps,
    setSteps,
    seed,
    setSeed,
    loraPath,
    setLoraPath,
    loraScale,
    setLoraScale,
    enhancedData,
    onEnhance,
    isEnhancing,
    onApplyEnhanced,
    result,
    slerpResult,
    isGenerating,
    onCritiqueAndRefine,
    isCritiquing,
    criticReport,
    activeNode,
    completedNodes,
  }), [
    mode, prompt, negativePrompt, initImage, strength,
    slerpSeedA, slerpSeedB, steps, seed, loraPath, loraScale,
    enhancedData, isEnhancing, result, slerpResult, isGenerating,
    isCritiquing, criticReport, activeNode, completedNodes
  ]);

  // Initial ComfyUI Layout Node Positions (matches reference image)
  const initialNodes = useMemo(() => [
    {
      id: 'checkpoint',
      type: 'checkpoint',
      position: { x: 40, y: 40 },
      data: sharedData,
    },
    {
      id: 'lora',
      type: 'lora',
      position: { x: 440, y: 40 },
      data: sharedData,
    },
    {
      id: 'rag',
      type: 'rag',
      position: { x: 40, y: 320 },
      data: sharedData,
    },
    {
      id: 'prompt_pos',
      type: 'prompt_pos',
      position: { x: 440, y: 320 },
      data: sharedData,
    },
    {
      id: 'prompt_neg',
      type: 'prompt_neg',
      position: { x: 440, y: 630 },
      data: sharedData,
    },
    {
      id: 'latent',
      type: 'latent',
      position: { x: 440, y: 900 },
      data: sharedData,
    },
    {
      id: 'ksampler',
      type: 'ksampler',
      position: { x: 920, y: 280 },
      data: sharedData,
    },
    {
      id: 'vae_decode',
      type: 'vae_decode',
      position: { x: 1360, y: 280 },
      data: sharedData,
    },
    {
      id: 'save_image',
      type: 'save_image',
      position: { x: 1720, y: 120 },
      data: sharedData,
    },
  ], [sharedData]);

  // Characteristic ComfyUI Colored Spline Wires
  const initialEdges = useMemo(() => [
    // Model & Clip from Checkpoint to LoRA
    {
      id: 'e-ckpt-lora-model',
      source: 'checkpoint',
      sourceHandle: 'model',
      target: 'lora',
      targetHandle: 'model-in',
      style: { stroke: '#a855f7', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'checkpoint' || activeNode === 'lora'),
    },
    {
      id: 'e-ckpt-lora-clip',
      source: 'checkpoint',
      sourceHandle: 'clip',
      target: 'lora',
      targetHandle: 'clip-in',
      style: { stroke: '#eab308', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'checkpoint' || activeNode === 'lora'),
    },
    // LoRA to KSampler (Model)
    {
      id: 'e-lora-ksampler-model',
      source: 'lora',
      sourceHandle: 'model-out',
      target: 'ksampler',
      targetHandle: 'model',
      style: { stroke: '#a855f7', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'lora' || activeNode === 'ksampler'),
    },
    // LoRA to Positive & Negative CLIP Encoders
    {
      id: 'e-lora-clip-pos',
      source: 'lora',
      sourceHandle: 'clip-out',
      target: 'prompt_pos',
      targetHandle: 'clip-in',
      style: { stroke: '#eab308', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'prompt_pos'),
    },
    {
      id: 'e-lora-clip-neg',
      source: 'lora',
      sourceHandle: 'clip-out',
      target: 'prompt_neg',
      targetHandle: 'clip-in',
      style: { stroke: '#eab308', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'prompt_neg'),
    },
    // Positive Conditioning to KSampler
    {
      id: 'e-pos-ksampler',
      source: 'prompt_pos',
      sourceHandle: 'conditioning',
      target: 'ksampler',
      targetHandle: 'positive',
      style: { stroke: '#f97316', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'ksampler'),
    },
    // Negative Conditioning to KSampler
    {
      id: 'e-neg-ksampler',
      source: 'prompt_neg',
      sourceHandle: 'conditioning',
      target: 'ksampler',
      targetHandle: 'negative',
      style: { stroke: '#f97316', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'ksampler'),
    },
    // Latent Input to KSampler
    {
      id: 'e-latent-ksampler',
      source: 'latent',
      sourceHandle: 'latent',
      target: 'ksampler',
      targetHandle: 'latent',
      style: { stroke: '#ec4899', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'latent' || activeNode === 'ksampler'),
    },
    // KSampler to VAE Decode (Samples)
    {
      id: 'e-ksampler-vae-samples',
      source: 'ksampler',
      sourceHandle: 'latent-out',
      target: 'vae_decode',
      targetHandle: 'samples',
      style: { stroke: '#ec4899', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'ksampler' || activeNode === 'vae_decode'),
    },
    // Checkpoint to VAE Decode (VAE weights)
    {
      id: 'e-ckpt-vae',
      source: 'checkpoint',
      sourceHandle: 'vae',
      target: 'vae_decode',
      targetHandle: 'vae',
      style: { stroke: '#ef4444', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'vae_decode'),
    },
    // VAE Decode to Save Image
    {
      id: 'e-vae-save-image',
      source: 'vae_decode',
      sourceHandle: 'image',
      target: 'save_image',
      targetHandle: 'images',
      style: { stroke: '#22c55e', strokeWidth: 2.5 },
      animated: isGenerating && (activeNode === 'save_image'),
    },
  ], [isGenerating, activeNode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync data updates to nodes
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: sharedData,
      }))
    );
  }, [sharedData, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="comfy-canvas-area">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(evt, node) => onNodeClick(node.id)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        {/* Dot Grid Background */}
        <Background color="#2a2c33" gap={22} size={1.6} variant="dots" />

        {/* ComfyUI Controls on Bottom Left */}
        <Controls position="bottom-left" showInteractive={false} />

        {/* ComfyUI MiniMap on Bottom Right */}
        <MiniMap
          position="bottom-right"
          nodeColor={(n) => {
            if (n.id === 'checkpoint') return '#a855f7';
            if (n.id === 'lora') return '#8b5cf6';
            if (n.id === 'rag') return '#06b6d4';
            if (n.id === 'prompt_pos' || n.id === 'prompt_neg') return '#f97316';
            if (n.id === 'latent') return '#ec4899';
            if (n.id === 'ksampler') return '#3b82f6';
            if (n.id === 'vae_decode') return '#ef4444';
            if (n.id === 'save_image') return '#22c55e';
            return '#374151';
          }}
          maskColor="rgba(18, 19, 22, 0.75)"
        />
      </ReactFlow>
    </div>
  );
}
