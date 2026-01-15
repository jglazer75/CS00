import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { AiTaskDefinition } from '@/lib/ai/schema';

// Lazy load components
const DocumentAnalyzer = dynamic(() => import('./DocumentAnalyzer'));
const NegotiationSimulator = dynamic(() => import('./NegotiationSimulator'));

export const AI_COMPONENT_REGISTRY: Record<string, ComponentType<{ task: AiTaskDefinition }>> = {
  DocumentAnalyzer,
  NegotiationSimulator,
  // Add other components here
};

export function getAiComponent(componentName: string): ComponentType<{ task: AiTaskDefinition }> | null {
  return AI_COMPONENT_REGISTRY[componentName] || null;
}
