import type { HttpFunction } from "@google-cloud/functions-framework";

export type WrapperFn = (fn: HttpFunction) => HttpFunction;
