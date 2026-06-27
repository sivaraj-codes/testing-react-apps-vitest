import { http, HttpResponse, delay } from "msw";
export const handlers = [
  http.post(
    "https://auth-provider.example.com/api/login",
    async ({ request }) => {
      const body = await request.json();
      if (!body.password) {
        await delay(0);
        return HttpResponse.json(
          { message: "password required" },
          { status: 400 },
        );
      }
      if (!body.username) {
        await delay(0);
        return HttpResponse.json(
          { message: "username required" },
          { status: 400 },
        );
      }
      await delay(0);
      return HttpResponse.json({ username: body.username });
    },
  ),
];
