"use client";
import { BookerEmbed } from "@calcom/atoms";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useTheme } from "next-themes";

export default function ScheduleDemoButton() {
  const { resolvedTheme } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full mt-4 bg-orange-500 hover:bg-orange-600">
          Schedule a demo
        </Button>
      </DialogTrigger>

      <DialogContent
        className="p-0 sm:rounded-2xl bg-white dark:bg-gray-950"
        style={{
          width: "95vw",
          maxWidth: "1200px",
          height: "80vh",
          maxHeight: "90vh",
          marginTop: "25px", // 👈 push below fixed header
          transform: "none", // 👈 disable default centering
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
          <DialogTitle className="text-xl font-semibold">
            Book a Demo
          </DialogTitle>
        </div>

        <div className="flex-1 overflow-auto">
          <BookerEmbed
            eventSlug="30min"
            username="scopegrid"
            onCreateBookingSuccess={() => alert("Booked!")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
