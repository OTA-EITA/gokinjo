/**
 * Basic type check for useMemoizedData hook
 * This file ensures the hook has correct TypeScript types
 */

import { useMemoizedData } from '../hooks/useMemoizedData';

// Type-only test - no runtime execution needed
export type UseMemoizedDataTest = typeof useMemoizedData;

// Verify the hook is properly exported
const _hookExists: UseMemoizedDataTest = useMemoizedData;

// Prevent unused variable error
export const testUseMemoizedDataExists = () => _hookExists;
