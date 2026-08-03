import axios from "axios";
import { LoginResponse } from "@/lib/types";

export interface LoginPayload {
  username: string;
  password: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(
      "/api/auth/login",
      payload
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    // logout can be added later
  },
};
