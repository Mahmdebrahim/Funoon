import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { reviewService } from '../services/review.service'
import StarRating from '../../../components/Ui/StarRating'

export default function ReviewModal({
  orderId,
  artistId,
  isOpen,
  onClose,
  existingReview = null,
  onSuccess,
}) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const isEditing = !!existingReview?._id

  // ─── Initialize form on open ───
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5)
      setComment(existingReview.comment || '')
    } else {
      setRating(5)
      setComment('')
    }
    setErrorMsg('')
  }, [existingReview, isOpen])

  // ─── Mutation ───
  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        return await reviewService.updateReview(existingReview._id, {
          rating,
          comment,
        })
      } else {
        return await reviewService.createReview({
          orderId,
          rating,
          comment,
        })
      }
    },
    onSuccess: async (data) => {
      toast.success(
        isEditing ? 'تم تحديث تقييمك بنجاح' : 'تم إرسال تقييمك بنجاح',
      )

      queryClient.invalidateQueries({
        queryKey: ['myOrders'],
        refetchType: 'all',  
      })

      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return (
            key === 'artist-reviews' ||
            key === 'my-reviews' ||
            key === 'artist' ||
            key === 'artists' ||
            key === 'order'
          )
        },
        refetchType: 'all',
      })

      if (onSuccess) onSuccess(data)
      onClose()
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        'حدث خطأ أثناء حفظ التقييم'
      toast.error(msg)
      setErrorMsg(msg)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg('يرجى اختيار التقييم بالنجوم (1 إلى 5)')
      return
    }

    const trimmed = comment.trim()
    if (trimmed.length > 0 && trimmed.length < 3) {
      setErrorMsg('التعليق يجب أن يكون 3 حروف على الأقل عند كتابته')
      return
    }
    if (trimmed.length > 500) {
      setErrorMsg('التعليق لا يمكن أن يتجاوز 500 حرف')
      return
    }

    mutation.mutate()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              >
                <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-md border border-[var(--color-outline-variant)]/40 shadow-2xl p-6 pointer-events-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-outline-variant)]/30">
                    <Dialog.Title className="font-display text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span>
                        {isEditing ? 'تعديل تقييم الفنان' : 'تقييم الفنان'}
                      </span>
                    </Dialog.Title>
                    <Dialog.Close
                      onClick={onClose}
                      className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors p-1"
                    >
                      <X className="w-5 h-5" />
                    </Dialog.Close>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {errorMsg && (
                      <div className="p-3 text-xs font-body text-red-600 bg-red-50 border border-red-200">
                        {errorMsg}
                      </div>
                    )}

                    {/* Interactive Star Rating */}
                    <div className="text-center py-2">
                      <label className="block text-xs font-body font-semibold text-[var(--color-on-surface-variant)] mb-3">
                        اختر التقييم (من 1 إلى 5 نجوم)
                      </label>
                      <div className="flex justify-center">
                        <StarRating
                          value={rating}
                          onChange={(val) => setRating(val)}
                          size="lg"
                        />
                      </div>
                    </div>

                    {/* Comment Textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-body font-semibold text-[var(--color-on-surface-variant)]">
                          تعليقك على التجربة (اختياري)
                        </label>
                        <span className="text-[11px] font-mono text-[var(--color-on-surface-variant)]">
                          {comment.length}/500
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={500}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="اكتب انطباعك ورأيك في اللوحة وتجربة الشراء من الفنان..."
                        className="w-full p-3 text-xs font-body bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/60 focus:border-[var(--color-primary)] focus:outline-none transition-colors text-[var(--color-on-surface)] resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={mutation.isPending}
                        className="px-4 py-2 text-xs font-body font-semibold text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]/60 hover:bg-[var(--color-surface-container)] transition-colors disabled:opacity-50"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="px-6 py-2 text-xs font-body font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {mutation.isPending && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        <span>
                          {isEditing ? 'تحديث التقييم' : 'إرسال التقييم'}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}