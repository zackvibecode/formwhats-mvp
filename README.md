# FormWhats

Create simple forms that turn customer answers into WhatsApp-ready leads.

This is **STEP 1** of the MVP: only the Next.js project structure with placeholder pages.
No database, no authentication, no payments yet.

## Tech Stack

- [Next.js 14](https://nextjs.org/) with the App Router
- TypeScript
- Tailwind CSS

## Routes

| Route                                    | Purpose                          |
| ---------------------------------------- | -------------------------------- |
| `/`                                      | Marketing homepage               |
| `/dashboard`                             | List of the user's forms         |
| `/dashboard/forms/new`                   | Create a new form                |
| `/dashboard/forms/[id]/edit`             | Edit an existing form            |
| `/dashboard/forms/[id]/responses`        | View responses for a form        |
| `/form/[slug]`                           | Public form filled by customers  |

## Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Try a few placeholder routes:

- http://localhost:3000/dashboard
- http://localhost:3000/dashboard/forms/new
- http://localhost:3000/dashboard/forms/123/edit
- http://localhost:3000/dashboard/forms/123/responses
- http://localhost:3000/form/my-first-form

## Project Structure

```
app/
  layout.tsx                  # Root layout (white background, black text)
  globals.css                 # Tailwind directives
  page.tsx                    # Homepage `/`
  dashboard/
    page.tsx                  # `/dashboard`
    forms/
      new/
        page.tsx              # `/dashboard/forms/new`
      [id]/
        edit/
          page.tsx            # `/dashboard/forms/[id]/edit`
        responses/
          page.tsx            # `/dashboard/forms/[id]/responses`
  form/
    [slug]/
      page.tsx                # `/form/[slug]`
```

## Next Steps (not in this step)

- Add Supabase for storing forms and responses
- Add authentication
- Build the form builder UI
- Generate the WhatsApp deep link on submit
- Deploy to Vercel
