import { SiteURL } from '@/constants/site-url'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface InviteToWorkspaceEmailProps {
  workspace_name: string
  invite_link: string
  inviter_name: string
}

export const InviteToWorkspaceEmail = ({
  workspace_name,
  invite_link,
  inviter_name,
}: InviteToWorkspaceEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>
        {inviter_name} invited you to collaborate in {workspace_name}
      </Preview>
      <Container style={container}>
        <Img
          src={`${SiteURL.BASE}/logo/toomind-darkx256.png`}
          width="42"
          height="42"
          alt="Toolmind"
          style={logo}
        />
        <Heading style={heading}>
          {inviter_name} invited you to join {workspace_name}
        </Heading>
        <Section style={buttonContainer}>
          <Button style={button} href={invite_link}>
            Join the workspace
          </Button>
        </Section>
        <Text style={paragraph}>
          Click the link above to join {workspace_name} on Toolmind. If you
          already have an account, you can log in using the same link.
        </Text>
        <Hr style={hr} />
        <Link href="https://toolmind.ai" style={reportLink}>
          Toolmind
        </Link>
      </Container>
    </Body>
  </Html>
)

export default InviteToWorkspaceEmail

const logo = {
  borderRadius: 21,
  width: 42,
  height: 42,
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
}

const paragraph = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
}

const buttonContainer = {
  padding: '27px 0 27px',
}

const button = {
  backgroundColor: '#5e6ad2',
  borderRadius: '3px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '11px 23px',
}

const reportLink = {
  fontSize: '14px',
  color: '#b4becc',
}

const hr = {
  borderColor: '#dfe1e4',
  margin: '42px 0 26px',
}

const code = {
  fontFamily: 'monospace',
  fontWeight: '700',
  padding: '1px 4px',
  backgroundColor: '#dfe1e4',
  letterSpacing: '-0.3px',
  fontSize: '21px',
  borderRadius: '4px',
  color: '#3c4149',
}
