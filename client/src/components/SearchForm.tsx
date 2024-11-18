import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Input } from "./ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const searchSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

type SearchFormProps = {
  onSearch: (username: string) => void;
};

export function SearchForm({ onSearch }: SearchFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof searchSchema>>({
    defaultValues: {
      username: "",
    },
  });

  async function onSubmit(data: z.infer<typeof searchSchema>) {
    try {
      setIsGenerating(true);
      await onSearch(data.username);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  placeholder="Enter X username"
                  {...field}
                  disabled={isGenerating}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </form>
    </Form>
  );
}
