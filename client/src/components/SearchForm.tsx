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
  disabled?: boolean;
};

export function SearchForm({ onSearch, disabled }: SearchFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof searchSchema>>({
    defaultValues: {
      username: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof searchSchema>) => {
    try {
      setIsGenerating(true);
      await onSearch(data.username.trim());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  placeholder="Enter X username"
                  {...field}
                  disabled={isGenerating || disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isGenerating || disabled}>
          {isGenerating ? "Generating..." : "Search"}
        </Button>
      </form>
    </Form>
  );
}