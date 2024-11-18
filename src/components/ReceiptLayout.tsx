import * as React from "react"
import { twMerge } from "tailwind-merge"
import {
  PDFDownloadLink,
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { XReceiptPDF } from "@/components/XReceiptPDF"

interface ReceiptLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  username: string
  metrics: {
    followers: number
    following: number
    tweets: number
  }
}

export function ReceiptLayout({
  username,
  metrics,
  className,
  children,
  ...props
}: ReceiptLayoutProps) {
  return (
    <div
      className={twMerge(
        "relative flex w-full max-w-md flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">X Receipt</h2>
          <p className="text-sm text-muted-foreground">
            A receipt for your X (Twitter) account.
          </p>
        </div>
        <PDFDownloadLink
          document={<XReceiptPDF username={username} metrics={metrics} />}
          fileName={`x-receipt-${username}.pdf`}
        >
          {({ loading }) => (
            <Button
              variant="outline"
              size="icon"
              disabled={loading}
              onClick={() => {
                // Add any additional onClick handling here if needed
                console.log("Downloading PDF for", username)
              }}
            >
              <Download className="size-4" />
              <span className="sr-only">Download Receipt</span>
            </Button>
          )}
        </PDFDownloadLink>
      </div>
      {children}
    </div>
  )
}
