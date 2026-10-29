import React from "react";
import Head from "expo-router/head";

const sections = [
  { id: "responsavel", title: "1. Responsável e contato", paragraphs: [
    "O responsável pelo Jasper AI é Alisson Maciel Ferreira Santos, pessoa física. Esta política descreve o tratamento de dados relacionado ao site, às compras e licenças e ao aplicativo desktop Jasper AI.",
    "Para dúvidas ou solicitações sobre seus dados pessoais, entre em contato pelo e-mail alissontar18@gmail.com."
  ] },
  { id: "compras", title: "2. Compras, pagamentos e licenças", paragraphs: [
    "O fluxo de compra utiliza nome e e-mail do comprador, identificação do pedido, produto, quantidade, valores e situação do pagamento para processar a compra, disponibilizar licenças e prestar atendimento.",
    "O checkout é realizado pelo Mercado Pago. O Jasper recebe os identificadores e estados necessários à confirmação do pagamento. Os dados inseridos no ambiente do prestador de pagamentos também são tratados conforme os termos e a política desse prestador.",
    "A ativação e validação da licença utilizam a chave de licença, identificadores da instalação e do dispositivo, uma representação derivada da máquina e registros de estado e atividade. Esses dados permitem vincular a licença ao dispositivo, validar seu uso e lidar com liberação ou revogação."
  ] },
  { id: "assistente", title: "3. Dados utilizados pelo assistente", paragraphs: [
    "Conforme as funcionalidades ativadas e os pedidos realizados, o Jasper pode processar mensagens, preferências, informações de memória, lembretes, dados de uso do computador e conteúdo necessário às ações solicitadas. Recursos de voz utilizam áudio do microfone; recursos de imagem e controle podem envolver imagens da tela e informações dos aplicativos com os quais você interage.",
    "O processamento pode ocorrer no computador ou nos serviços externos configurados para inteligência artificial, voz e integrações. O funcionamento do Jasper não é exclusivamente local. Você deve considerar o conteúdo que compartilha e as funcionalidades que ativa.",
    "O consentimento operacional para controlar o sistema não substitui as informações e autorizações específicas necessárias ao tratamento de dados ou à conexão de contas externas."
  ] },
  { id: "google", title: "4. Conexão com Google e Gmail", paragraphs: [
    "A conexão da conta Google é opcional e realizada no navegador do sistema, por autorização OAuth. O Jasper não solicita sua senha Google dentro do aplicativo. A ativação da licença é independente dessa autorização.",
    "Mediante os acessos concedidos, o módulo de e-mails utiliza a identificação da conta e dados de mensagens, como remetentes, destinatários, assuntos, datas, texto, pastas, rótulos e metadados de anexos. As finalidades são pesquisar, consultar e resumir mensagens, preparar rascunhos, enviar, responder, encaminhar e organizar e-mails conforme as funcionalidades utilizadas.",
    "A integração solicita identificação da conta e a permissão Gmail gmail.modify. Os tokens de autorização são protegidos localmente pelo armazenamento seguro do Electron/Windows. O módulo desktop não usa um servidor Jasper para intermediar os tokens ou a caixa postal.",
    "Conteúdo de e-mails consultados pode integrar o contexto transmitido ao serviço de IA configurado pelo usuário para compreender pedidos e compor respostas. Portanto, conectar a conta no computador não significa que o texto consultado nunca seja transmitido a terceiros. Essa transmissão tem a finalidade de atender à solicitação feita no assistente; a autorização da conta não autoriza comercializar suas mensagens ou utilizá-las para publicidade.",
    "Anexos selecionados para envio ou preservados em encaminhamentos são tratados como arquivos, sem interpretação de seu conteúdo pelo módulo. Downloads de anexos estão indisponíveis enquanto essa capacidade estiver adiada."
  ] },
  { id: "prestadores", title: "5. Prestadores e processamento externo", paragraphs: [
    "A arquitetura do site utiliza Google Firebase para hospedagem, conteúdo e autenticação administrativa; Cloudflare Worker e D1 para operações de pedidos e licenças; e Mercado Pago para checkout. Cada serviço recebe os dados necessários ao fluxo em que participa. Isso não significa que todos esses prestadores recebam o conteúdo dos seus e-mails.",
    "O aplicativo pode utilizar Google Gemini, Groq ou execução local com Ollama, conforme a configuração, além dos serviços de voz selecionados. Nas modalidades remotas, os dados necessários ao pedido podem ser transmitidos ao provedor correspondente. Usar uma chave própria de API não elimina esse processamento.",
    "Prestadores externos podem processar dados em outros países e aplicar suas condições de retenção e uso. Essas condições variam por serviço, plano e configuração; não se deve presumir retenção zero ou condições idênticas de uso para treinamento em todos os provedores. Consulte as políticas dos serviços escolhidos antes de enviar dados pessoais ou confidenciais."
  ] },
  { id: "navegador", title: "6. Cookies e armazenamento no navegador", paragraphs: [
    "O site utiliza localStorage para lembrar o idioma e o fechamento de promoções, e sessionStorage para manter a referência de acesso ao pedido durante a sessão. Esses recursos podem ser removidos nas configurações do navegador; removê-los pode apagar preferências ou impedir recuperar um pedido naquela sessão.",
    "A autenticação administrativa utiliza recursos de armazenamento do Firebase. O código também permite Google Analytics quando um identificador de medição está configurado e o navegador oferece suporte. Nessa situação, o serviço pode utilizar cookies ou identificadores para métricas de navegação; as opções de privacidade e bloqueio do navegador podem afetar essa coleta.",
    "As conexões com os serviços de hospedagem, fontes, APIs e pagamentos envolvem dados técnicos de rede, como endereço IP e informações da requisição. A API de pedidos e licenças utiliza o IP no controle de volume de requisições e prevenção de abuso."
  ] },
  { id: "finalidades", title: "7. Finalidades e bases de tratamento", paragraphs: [
    "Os dados de compra, atendimento e licença são utilizados para procedimentos relacionados à contratação e execução do serviço. Registros também podem ser necessários ao cumprimento de obrigações legais e ao exercício regular de direitos, quando aplicáveis.",
    "Funcionalidades opcionais e integrações dependem das escolhas e permissões pertinentes. Quando o tratamento depender de consentimento, ele poderá ser revogado, observados os efeitos da revogação e as hipóteses legais de conservação. A existência de uma permissão técnica não autoriza usos incompatíveis com a finalidade informada."
  ] },
  { id: "retencao", title: "8. Armazenamento, retenção e segurança", paragraphs: [
    "Configurações e dados operacionais podem permanecer no computador conforme as funcionalidades utilizadas. Credenciais contempladas pelo armazenamento seguro são protegidas por mecanismos do Electron/Windows; isso não significa que todos os arquivos locais estejam criptografados.",
    "Registros de compra, pagamento, licença e atendimento têm tratamento separado dos dados locais do assistente. Sua conservação considera a finalidade, a prestação do serviço e as obrigações legalmente aplicáveis. Não há um prazo único de exclusão automática para todas as categorias.",
    "Fechar ou desinstalar o aplicativo não deve ser tomado como garantia de exclusão de todos os registros locais, registros comerciais ou dados mantidos por prestadores. Para avaliar a exclusão dos dados sob responsabilidade do Jasper, utilize o contato desta política. Empregamos medidas de proteção, mas nenhum sistema é imune a incidentes."
  ] },
  { id: "direitos", title: "9. Desconexão e solicitações de privacidade", paragraphs: [
    "Desconectar uma conta de e-mail no Jasper remove o segredo local da conexão e impede novas operações por ela. Para revogar também a permissão no Google, utilize os controles de aplicativos de terceiros da sua conta Google. A desconexão não desfaz mensagens ou operações já aceitas pelo provedor.",
    "Conforme os pressupostos e limites da legislação aplicável, você pode solicitar confirmação e informações sobre o tratamento, acesso, correção e, quando cabível, exclusão, bloqueio ou anonimização, além de informações sobre compartilhamento e revogação de consentimento.",
    "Encaminhe sua solicitação para alissontar18@gmail.com. Poderemos precisar verificar sua identidade de forma proporcional. A análise considera as hipóteses legais de conservação e os limites de controle sobre dados tratados por prestadores terceiros."
  ] },
  { id: "atualizacoes", title: "10. Atualizações desta política", paragraphs: [
    "Esta política poderá ser atualizada quando houver alterações relevantes nas práticas descritas. Mudanças no acesso ou uso de dados Google devem ser refletidas nas informações apresentadas ao usuário e nas autorizações aplicáveis, quando exigidas. A versão vigente permanece nesta página, com sua data de atualização."
  ] }
];

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Política de Privacidade | Jasper AI</title>
        <meta name="description" content="Saiba como o Jasper AI trata dados de compras, licenças, e-mails e inteligência artificial e como entrar em contato." />
        <link rel="canonical" href="https://jasper-avatar.web.app/privacidade" />
      </Head>
      <main className="min-h-screen bg-void text-frost" style={{ width: "100%", overflowWrap: "anywhere" }}>
        <header className="border-b border-white/10">
          <nav aria-label="Navegação principal" className="max-w-5xl mx-auto px-5 py-6 flex flex-wrap items-center justify-between gap-4">
            <a href="/" className="font-display text-sm tracking-widest text-neon">JASPER · AI</a>
            <a href="/" className="text-sm text-mist hover:text-neon transition-colors">← Voltar ao site</a>
          </nav>
        </header>
        <article aria-labelledby="privacidade-titulo" className="max-w-5xl mx-auto px-5 py-12 md:py-20">
          <p className="font-mono text-xs tracking-widest text-neon mb-5">TRANSPARÊNCIA · SEUS DADOS</p>
          <h1 id="privacidade-titulo" className="font-display font-bold leading-tight" style={{ fontSize: "clamp(1.9rem, 5vw, 3.4rem)" }}>Política de Privacidade</h1>
          <p className="text-mist leading-relaxed mt-5 max-w-3xl">Entenda quais dados participam do funcionamento do Jasper AI, das compras e das integrações que você escolhe utilizar.</p>
          <p className="font-mono text-xs text-mist mt-4">Última atualização: <time dateTime="2026-10-29">29 de outubro de 2026</time></p>
          <aside aria-label="Responsável e contato" className="rounded-2xl border border-neon/20 bg-panel p-6 my-9">
            <p className="font-semibold">Alisson Maciel Ferreira Santos · Pessoa física</p>
            <a className="inline-block mt-2 text-neon underline underline-offset-4" href="mailto:alissontar18@gmail.com">alissontar18@gmail.com</a>
          </aside>
          <nav aria-label="Índice da política" className="rounded-2xl border border-white/10 p-6 mb-12">
            <p className="font-semibold mb-4">Nesta página</p>
            <ol className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-mist">
              {sections.map(section => <li key={section.id}><a href={`#${section.id}`} className="hover:text-neon underline underline-offset-4">{section.title}</a></li>)}
            </ol>
          </nav>
          <div className="space-y-10">
            {sections.map(section => (
              <section id={section.id} key={section.id} aria-labelledby={`${section.id}-titulo`} style={{ scrollMarginTop: 24 }}>
                <h2 id={`${section.id}-titulo`} className="font-display font-semibold text-lg md:text-xl mb-4">{section.title}</h2>
                <div className="space-y-4 text-mist leading-relaxed text-base">
                  {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>
          <section aria-labelledby="links-titulo" className="mt-12 pt-8 border-t border-white/10">
            <h2 id="links-titulo" className="font-semibold mb-4">Políticas e controles dos serviços</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-neon">
              {[
                ["Google e Firebase", "https://policies.google.com/privacy"],
                ["Acessos da conta Google", "https://myaccount.google.com/connections"],
                ["Cloudflare", "https://www.cloudflare.com/privacypolicy/"],
                ["Mercado Pago", "https://www.mercadopago.com.br/privacidade"],
                ["Groq", "https://groq.com/privacy-policy/"],
                ["LGPD", "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm"]
              ].map(([label, href]) => <li key={href}><a href={href} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">{label} ↗</a></li>)}
            </ul>
          </section>
        </article>
        <footer className="border-t border-white/10 px-5 py-8 text-sm text-mist">
          <div className="max-w-5xl mx-auto flex flex-wrap justify-between gap-4">
            <span>© 2026 Jasper AI</span><a href="/" className="text-neon">Voltar à página inicial</a>
          </div>
        </footer>
      </main>
    </>
  );
}
