'use client'

import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import { Share2, Download, Copy, X, Twitter, MessageCircle, Check, Loader2 } from 'lucide-react'

interface VisualShareProps {
  targetRef: React.RefObject<HTMLElement>
  title: string
  description: string
  url?: string
  className?: string
}

export default function VisualShare({
  targetRef,
  title,
  description,
  url = typeof window !== 'undefined' ? window.location.href : '',
  className = '',
}: VisualShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const captureImage = async () => {
    if (!targetRef.current) return null

    setIsCapturing(true)
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      })
      const dataUrl = canvas.toDataURL('image/png')
      setCapturedImage(dataUrl)
      return dataUrl
    } catch (error) {
      console.error('Failed to capture image:', error)
      return null
    } finally {
      setIsCapturing(false)
    }
  }

  const handleOpen = async () => {
    setIsOpen(true)
    if (!capturedImage) {
      await captureImage()
    }
  }

  const handleDownload = () => {
    if (!capturedImage) return

    const link = document.createElement('a')
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-theworldtruth.png`
    link.href = capturedImage
    link.click()
  }

  const handleCopyImage = async () => {
    if (!capturedImage) return

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback: copy URL
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    if (!capturedImage) return

    try {
      // Convert to blob for sharing
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      const file = new File([blob], 'theworldtruth-share.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text: description,
          url,
          files: [file],
        })
      } else if (navigator.share) {
        // Fallback without image
        await navigator.share({
          title,
          text: `${description}\n\n${url}`,
        })
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${description}\n\n`)
    const shareUrl = encodeURIComponent(url)
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      '_blank',
      'width=550,height=420'
    )
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${description}\n\n${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Share</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="mb-6">
              {isCapturing ? (
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Preview"
                  className="w-full rounded-lg border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Generating preview...</span>
                </div>
              )}
            </div>

            {/* Share Options */}
            <div className="space-y-3">
              {/* Native Share (mobile) */}
              {'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  disabled={!capturedImage}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">Share with Image</span>
                </button>
              )}

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleTwitterShare}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  <span className="font-medium">X / Twitter</span>
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">WhatsApp</span>
                </button>
              </div>

              {/* Download & Copy */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownload}
                  disabled={!capturedImage}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Download</span>
                </button>
                <button
                  onClick={handleCopyImage}
                  disabled={!capturedImage}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span className="font-medium">Copy Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> Download the image and attach it when sharing on social media for the best visual impact!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
