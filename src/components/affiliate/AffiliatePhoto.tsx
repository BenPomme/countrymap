'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { AffiliatePhotoMetadata } from '@/lib/affiliate/photos'

interface Props {
  photo: AffiliatePhotoMetadata
  fallback: ReactNode
  className?: string
  fallbackClassName?: string
  imageClassName?: string
}

/** A decorative local photo that leaves the surrounding action usable if it fails. */
export default function AffiliatePhoto({
  photo,
  fallback,
  className = '',
  fallbackClassName = '',
  imageClassName = '',
}: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const showPhoto = failedSrc !== photo.src

  useEffect(() => {
    const image = imageRef.current
    if (image?.complete && image.naturalWidth === 0) setFailedSrc(photo.src)
  }, [photo.src])

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <span aria-hidden="true" className={`absolute inset-0 flex ${fallbackClassName}`}>
        {fallback}
      </span>
      {showPhoto && (
        <img
          ref={imageRef}
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(photo.src)}
          className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`}
        />
      )}
    </span>
  )
}
