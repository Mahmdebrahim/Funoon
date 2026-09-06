import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "../../auth/stores/authStore";
import { profileService } from "../services/profile.service";
import api from "../../../services/api";

// نخزن الـ raw avatar path في الـ store (الـ Navbar تعمل getMediaUrl بنفسها)
function syncUserToStore(user) {
  if (!user) return;
  useAuthStore.getState().updateUser({
    name: user.name,
    phone: user.phone,
    bio: user.bio,
    avatar: user.avatar,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getProfile,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      syncUserToStore(data);
      toast.success("تم تحديث الملف الشخصي بنجاح");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل تحديث الملف الشخصي");
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileService.uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      syncUserToStore(data);
      toast.success("تم تحديث الصورة الشخصية");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل رفع الصورة");
    },
  });
}

// ═══ Cover Image (Plus/Prestige only) ═══
export const useUploadCoverImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("coverImage", file);
      const res = await api.post("/users/cover-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("تم رفع صورة الغلاف بنجاح");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "فشل رفع الصورة");
      console.log(err);
    },
  });
};

export const useDeleteCoverImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete("/users/cover-image");
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("تم حذف صورة الغلاف");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "فشل الحذف");
    },
  });
};

export function useChangePassword() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: profileService.changePassword,
    onSuccess: async () => {
      toast.success("تم تغيير كلمة المرور. يرجى تسجيل الدخول مجدداً");
      await logout();
      window.location.href = "/login";
    },
    onError: (error) => {
      toast.error(error?.message || "فشل تغيير كلمة المرور");
    },
  });
}

export function useAddress() {
  return useQuery({
    queryKey: ["address"],
    queryFn: profileService.getAddress,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileService.updateAddress,
    onSuccess: (data) => {
      queryClient.setQueryData(["address"], data);
      toast.success("تم تحديث العنوان بنجاح");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل تحديث العنوان");
    },
  });
}

export function useLookupAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileService.lookupAddress,
    onSuccess: (data) => {
      // الـ backend بيحفظ العنوان، فـ نحدّث الـ query بالـ address المحفوظ
      queryClient.setQueryData(["address"], data?.address ?? data);
      toast.success("تم التحقق من العنوان وتعبئة البيانات ✅");
    },
    onError: (error) => {
      toast.error(
        error?.message || "تعذّر التحقق من الرمز، تأكد منه وحاول مجدداً",
      );
    },
  });
}

export function useBankAccount() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["bankAccount"],
    queryFn: profileService.getBankAccount,
    enabled: user?.role === "artist",
    retry: false,
  });
}

export function useSetBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileService.setBankAccount,
    onSuccess: (data) => {
      queryClient.setQueryData(["bankAccount"], data);
      toast.success("تم حفظ بيانات الحساب البنكي");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل حفظ بيانات الحساب البنكي");
    },
  });
}

export function useDeleteAccount() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: profileService.deleteAccount,
    onSuccess: async () => {
      toast.success("تم حذف الحساب بنجاح");
      await logout();
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error?.message || "فشل حذف الحساب");
    },
  });
}
