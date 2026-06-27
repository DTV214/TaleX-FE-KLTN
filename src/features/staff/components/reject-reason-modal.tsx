"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

interface RejectReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function RejectReasonModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim().length < 10) return;
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lý do từ chối</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <textarea
            className="w-full min-h-[100px] rounded-lg border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {reason.length}/10 ký tự tối thiểu
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={reason.trim().length < 10 || isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
