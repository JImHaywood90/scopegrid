'use client';
import Image, { ImageProps } from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type Props = Omit<ImageProps, 'src'> & {
  light: string;
  dark?: string;
};

export default function ThemedImage({ light, dark, alt, ...img }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const src = mounted && dark && resolvedTheme === 'dark' ? dark : light;
  return <Image src={src} alt={alt} {...img} />;
}
