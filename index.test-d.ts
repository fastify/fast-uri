import uri, { URIComponents } from ".";
import { expectType } from "tsd";

const parsed = uri.parse("foo");
expectType<URIComponents>(parsed);
