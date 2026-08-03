import uri, {
  type URIComponent,
} from '..'
import { expect } from 'tstyche'

const parsed = uri.parse('foo')
expect(parsed).type.toBe<URIComponent>()

const parsed2 = uri.parse('foo', {
  domainHost: true,
  scheme: 'https',
  unicodeSupport: false
})

expect(parsed2).type.toBe<URIComponent>()

const mailtoComponent: URIComponent = {
  scheme: 'mailto',
  to: ['user@example.org'],
  subject: 'Hello',
  body: 'Message',
  headers: { cc: 'other@example.org' }
}

expect(uri.serialize(mailtoComponent, { unicodeSupport: true })).type.toBe<string>()

const parsedMailto = uri.parse('mailto:user@example.org')
expect(parsedMailto.to).type.toBe<string[] | undefined>()
expect(parsedMailto.subject).type.toBe<string | undefined>()
expect(parsedMailto.body).type.toBe<string | undefined>()
expect(parsedMailto.headers).type.toBe<{ [hfname: string]: string } | undefined>()
