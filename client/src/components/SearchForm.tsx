import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Input } from "./ui/input";

const searchSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

type SearchFormProps = {
  onSearch: (username: string) => void;
};

export function SearchForm({ onSearch }: SearchFormProps) {
  const form = useForm<z.infer<typeof searchSchema>>({
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(data: z.infer<typeof searchSchema>) {
    onSearch(data.username);
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
                <Input placeholder="Enter GitHub username" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Generate</Button>
      </form>
    </Form>
  );
}
