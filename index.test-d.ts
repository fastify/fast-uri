import uri, { URIComponents } from ".";
import { expectType } from "tsd";

const parsed = uri.parse("foo");
expectType<URIComponents>(parsed);
const parsed2 = uri.parse("foo", {
    domainHost: true,
    scheme: 'https',
    unicodeSupport: false
})
expectType<URIComponents>(parsed2);
