import { http, HttpResponse, delay } from "msw";
import { USERS_MAP } from "./constants";

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
      await delay(10);
      return HttpResponse.json({ username: body.username });
    },
  ),
  //users handler
  http.get("https://api.example.com/users/:userId", async ({ params }) => {
    const user = USERS_MAP[params.userId];
    console.log("userId", params.userId, "user", user);
    if (!user) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 });
    }
    return HttpResponse.json(user);
  }),
];
