import Image from 'next/image';
import dynamic from 'next/dynamic';

export const OptimizedImage = (props: any) => {
  return <Image loading="lazy" {...props} />;
};

export const LazyLoadedComponent = dynamic(() => import('./LazyComponent'), { ssr: false });
