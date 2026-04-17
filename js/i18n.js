// AxTrader Internationalization Module
// Supports: EN, FR, ES, AR, ZH (5 languages)

const LANGUAGES = ['en', 'fr', 'es', 'ar', 'zh'];
const STORAGE_KEY = 'ax_lang';
const RTL_LANGS = new Set(['ar']);

const i18n = {
  en: {
    home:'Home', signals:'Signals', games:'Games', news:'News', more:'More',
    hero_sub:'Where smart money leaves its footprint \u2014 we follow it.',
    win_rate:'Win Rate', members:'Members', markets:'Markets',
    inst_hub:'Institutional Edge Hub',
    latest_signals:'Latest Signals',
    view_all_signals:'View All Signals & Premium \u2192',
    market_intel:'Market Intelligence',
    loading_news:'Loading live news\u2026',
    news_all:'All', news_macro:'Macro', news_forex:'Forex & Gold', news_stocks:'Stocks',
    load_more:'Load More News \u2193',
    fear_greed:'Fear & Greed',
    sign_in:'Sign In', sign_up:'Sign Up',
    google_auth:'Continue with Google',
    section_account:'My Account', section_premium:'Premium',
    section_academy:'Trading Academy', section_bots:'Signal Bots',
    section_community:'Community & Social', section_tools:'Tools',
    section_settings:'App Settings', section_knowledge:'Knowledge & System',
    section_contact:'Contact & Support', section_legal:'Legal',
    upgrade_title:'Upgrade to Premium', upgrade_sub:'Unlock all signals, full academy, priority alerts',
    referral_title:'Refer & Earn', referral_sub:'Invite friends \u00b7 Both get 7 days free Premium',
    analytics_title:'Analytics', analytics_sub:'Performance stats \u00b7 Win rate \u00b7 P&L tracking',
    signal_alerts_title:'Signal Alerts', signal_alerts_sub:'Push notifications \u00b7 Alert preferences',
    language_title:'Language', install_title:'Install App',
    install_sub:'Add to home screen \u00b7 Offline access',
    gwp_title:'What is GWP?', gwp_sub:'The 5-Pillar Ghost Wick Protocol explained',
    system_status_title:'System Status', system_status_sub:'Live \u00b7 All systems operational',
    sign_out:'Sign Out', deep_dive:'Deep dive \u2193', show_less:'Show less \u2191',
    make_money_title:'Recommended Brokers', make_money_sub:'Trade on trusted exchanges',
    badge_free:'FREE', badge_premium:'PREMIUM BOOK',
    no_active_signals:'No active signals yet',
    active_signals_desc:'The bot scans markets every 30 minutes. Active signals will appear here automatically.',
    waiting_bot:'Waiting for bot signal...',
    free_signals_label:'FREE SIGNALS',
    free_signals_sub:'3 complete \u00b7 all markets',
    premium_signals_label:'PREMIUM SIGNALS',
    or_divider:'or', email_placeholder:'you@email.com', password_placeholder:'Password',
    name_placeholder:'Your name', min_chars:'Min 8 characters',
    forgot_msg:'Enter your email and we\'ll send a reset link.',
    active_members:'2,800+ Active Traders', signal_accuracy:'73%+ Live Accuracy', markets_covered:'3 Markets Covered',
    crypto_bot:'Crypto Signals Bot', forex_bot:'Forex Signals Bot', stocks_bot:'Stocks Signals Bot',
    tg_community:'Telegram Community', premium_desc:'Signal copier, priority alerts, analytics',
    email_support:'Email Support', direct_msg:'Direct Message',
    risk_disclaimer:'Risk Disclaimer', risk_sub:'Important \u2014 please read before trading',
    terms:'Terms & Conditions', terms_sub:'Usage policy \u00b7 Intellectual property',
    live_data:'Live Data Status', live_data_sub:'Tap refresh to check all data sources',
    check_sources:'Check All Sources', account_security:'Account Security',
    fill_fields:'Fill all fields', pass_min:'Password min 8 characters', login_first:'Please log in first',
    invalid_code:'Invalid code', premium_activated:'Premium activated! Welcome to the inner circle',
    admin_notified:'Admin notified \u2014 expect activation within 24h',
    payment_failed:'Could not create payment \u2014 try again or use another method',
    profile_saved:'Profile saved',
    welcome:'Welcome, ', signed_as:'Signed in as\u2026',
    new_signal:'New Signal:', tp1_hit:'TP1 Hit:', tp2_hit:'TP2 Hit:',
    tp3_hit:'TP3 Runner:', sl_hit:'Stop Loss:',
    active_signals_desc_short:'Bot scans every 30 minutes. Check back soon.',
    course_unlock:'Unlock',
    profit:'Profit', cash_out_at:'Cashed out at',
    // New pages
    performance_title:'Performance', performance_sub:'Historical signal accuracy and outcomes',
    total_signals:'Total Signals', avg_win_rate:'Avg Win Rate', max_drawdown:'Max Drawdown',
    cumulative_pl:'Cumulative P&L', monthly_results:'Monthly Results',
    about_title:'About AxTrader', about_sub:'Our mission, our team, our protocol',
    founder_bio_placeholder:'Founder bio and background coming soon.',
    mission_statement:'Our mission is to democratize institutional-grade trading signals and education, making smart-money setups accessible to every trader regardless of geography or account size.',
    privacy_title:'Privacy Policy', privacy_last_updated:'Last updated',
  },
  fr: {
    home:'Accueil', signals:'Signaux', games:'Jeux', news:'Actualit\u00e9s', more:'Plus',
    hero_sub:'L\u00e0 o\u00f9 l\'argent institutionnel laisse ses traces \u2014 nous le suivons.',
    win_rate:'Taux de Succ\u00e8s', members:'Membres', markets:'March\u00e9s',
    inst_hub:'Centre de Trading Institutionnel',
    latest_signals:'Derniers Signaux',
    view_all_signals:'Voir tous les Signaux & Premium \u2192',
    market_intel:'Intelligence de March\u00e9',
    loading_news:'Chargement des actualit\u00e9s\u2026',
    news_all:'Tout', news_macro:'Macro', news_forex:'Forex & Or', news_stocks:'Actions',
    load_more:'Charger plus \u2193',
    fear_greed:'Peur & Avidit\u00e9',
    sign_in:'Se connecter', sign_up:'S\'inscrire',
    google_auth:'Continuer avec Google',
    section_account:'Mon Compte', section_premium:'Premium',
    section_academy:'Acad\u00e9mie de Trading', section_bots:'Nos Bots de Signaux',
    section_community:'Communaut\u00e9 & Social', section_tools:'Outils',
    section_settings:'Param\u00e8tres', section_knowledge:'Connaissance & Syst\u00e8me',
    section_contact:'Contact & Support', section_legal:'L\u00e9gal',
    upgrade_title:'Passer \u00e0 Premium', upgrade_sub:'D\u00e9bloquer tous les signaux, acad\u00e9mie compl\u00e8te, alertes prioritaires',
    referral_title:'Parrainage & Gains', referral_sub:'Les deux obtiennent 7 jours de Premium gratuit',
    analytics_title:'Analytique', analytics_sub:'Stats de performance \u00b7 Taux de r\u00e9ussite \u00b7 Suivi P&L',
    signal_alerts_title:'Alertes de Signaux', signal_alerts_sub:'Notifications push \u00b7 Pr\u00e9f\u00e9rences d\'alertes',
    language_title:'Langue', install_title:'Installer l\'App',
    install_sub:'Ajouter \u00e0 l\'acc\u00e8s hors ligne',
    gwp_title:'Qu\'est-ce que le GWP?', gwp_sub:'Le Protocole Ghost Wick \u00e0 5 Piliers expliqu\u00e9',
    system_status_title:'\u00c9tat du Syst\u00e8me', system_status_sub:'En direct \u00b7 Tous les syst\u00e8mes op\u00e9rationnels',
    sign_out:'Se D\u00e9connecter',
    make_money_title:'Partenaires d\'\u00c9change', make_money_sub:'Inscrivez-vous via nos partenaires de confiance',
    badge_free:'GRATUIT', badge_premium:'LIVRE PREMIUM',
    no_active_signals:'Aucun signal actif pour le moment',
    active_signals_desc:'Le bot analyse les march\u00e9s toutes les 30 minutes. Les signaux actifs appara\u00eetront ici automatiquement.',
    waiting_bot:'En attente du signal du bot...',
    free_signals_label:'SIGNAUX GRATUITS', free_signals_sub:'3 complets \u00b7 tous les march\u00e9s', premium_signals_label:'SIGNAUX PREMIUM',
    or_divider:'ou', email_placeholder:'vous@email.com', password_placeholder:'Mot de passe',
    name_placeholder:'Votre nom', min_chars:'8 caract\u00e8res minimum',
    forgot_msg:'Entrez votre email et nous vous enverrons un lien de r\u00e9initialisation.',
    active_members:'2 800+ Traders Actifs', signal_accuracy:'73%+ Pr\u00e9cision en Direct', markets_covered:'3 March\u00e9s Couverts',
    crypto_bot:'Bot Signaux Crypto', forex_bot:'Bot Signaux Forex', stocks_bot:'Bot Signaux Actions',
    section_legal:'L\u00e9gal', course_unlock:'D\u00e9bloquer',
    profit:'Profit',
    performance_title:'Performance', performance_sub:'Pr\u00e9cision historique des signaux et r\u00e9sultats',
    about_title:'\u00c0 propos d\'AxTrader', about_sub:'Notre mission, notre \u00e9quipe, notre protocole',
    privacy_title:'Politique de Confidentialit\u00e9', privacy_last_updated:'Derni\u00e8re mise \u00e0 jour',
  },
  es: {
    home:'Inicio', signals:'Se\u00f1ales', games:'Juegos', news:'Noticias', more:'M\u00e1s',
    hero_sub:'Donde el dinero institucional deja su huella \u2014 nosotros lo seguimos.',
    win_rate:'Tasa de \u00c9xito', members:'Miembros', markets:'Mercados',
    inst_hub:'Centro de Ventaja Institucional',
    latest_signals:'\u00daltimas Se\u00f1ales',
    view_all_signals:'Ver todas las Se\u00f1ales & Premium \u2192',
    market_intel:'Inteligencia de Mercado',
    loading_news:'Cargando noticias\u2026',
    news_all:'Todo', news_macro:'Macro', news_forex:'Forex & Oro', news_stocks:'Acciones',
    load_more:'Cargar m\u00e1s \u2193',
    fear_greed:'Miedo & Codicia',
    sign_in:'Iniciar sesi\u00f3n', sign_up:'Registrarse',
    google_auth:'Continuar con Google',
    section_account:'Mi Cuenta', section_premium:'Premium',
    section_academy:'Academia de Trading', section_bots:'Nuestros Bots de Se\u00f1ales',
    section_community:'Comunidad & Social', section_tools:'Herramientas',
    section_settings:'Configuraci\u00f3n', section_knowledge:'Conocimiento & Sistema',
    section_contact:'Contacto & Soporte', section_legal:'Legal',
    upgrade_title:'Mejorar a Premium', upgrade_sub:'Desbloquear todas las se\u00f1ales, academia completa, alertas prioritarias',
    referral_title:'Referir & Ganar', referral_sub:'Ambos obtienen 7 d\u00edas de Premium gratis',
    analytics_title:'Anal\u00edtica', analytics_sub:'Estad\u00edsticas \u00b7 Tasa de \u00e9xito \u00b7 Seguimiento P&L',
    signal_alerts_title:'Alertas de Se\u00f1ales', signal_alerts_sub:'Notificaciones push \u00b7 Preferencias de alertas',
    language_title:'Idioma', install_title:'Instalar App',
    install_sub:'A\u00f1adir a pantalla de inicio \u00b7 Acceso sin conexi\u00f3n',
    gwp_title:'\u00bfQu\u00e9 es GWP?', gwp_sub:'El Protocolo Ghost Wick de 5 Pilares explicado',
    system_status_title:'Estado del Sistema', system_status_sub:'En vivo \u00b7 Todos los sistemas operativos',
    sign_out:'Cerrar Sesi\u00f3n',
    make_money_title:'Socios de Exchange', make_money_sub:'Reg\u00edstrate v\u00eda nuestros socios de confianza',
    badge_free:'GRATIS', badge_premium:'LIBRO PREMIUM',
    no_active_signals:'No hay se\u00f1ales activas a\u00fan',
    active_signals_desc:'El bot escanea los mercados cada 30 minutos. Las se\u00f1ales activas aparecer\u00e1n aqu\u00ed autom\u00e1ticamente.',
    waiting_bot:'Esperando se\u00f1al del bot...',
    free_signals_label:'SE\u00d1ALES GRATIS', free_signals_sub:'3 completas \u00b7 todos los mercados', premium_signals_label:'SE\u00d1ALES PREMIUM',
    or_divider:'o', email_placeholder:'tu@email.com', password_placeholder:'Contrase\u00f1a',
    name_placeholder:'Tu nombre', min_chars:'M\u00ednimo 8 caracteres',
    forgot_msg:'Ingresa tu email y te enviaremos un enlace para restablecer.',
    active_members:'2.800+ Traders Activos', signal_accuracy:'73%+ Precisi\u00f3n en Vivo', markets_covered:'3 Mercados Cubiertos',
    crypto_bot:'Bot Se\u00f1ales Cripto', forex_bot:'Bot Se\u00f1ales Forex', stocks_bot:'Bot Se\u00f1ales Acciones',
    section_legal:'Legal', course_unlock:'Desbloquear',
    profit:'Ganancia',
    performance_title:'Rendimiento', performance_sub:'Precisi\u00f3n hist\u00f3rica de se\u00f1ales y resultados',
    about_title:'Acerca de AxTrader', about_sub:'Nuestra misi\u00f3n, nuestro equipo, nuestro protocolo',
    privacy_title:'Pol\u00edtica de Privacidad', privacy_last_updated:'\u00daltima actualizaci\u00f3n',
  },
  ar: {
    home:'\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629', signals:'\u0625\u0634\u0627\u0631\u0627\u062a', games:'\u0623\u0644\u0639\u0627\u0628', news:'\u0623\u062e\u0628\u0627\u0631', more:'\u0627\u0644\u0645\u0632\u064a\u062f',
    hero_sub:'\u062d\u064a\u062b \u064a\u062a\u0631\u0643 \u0627\u0644\u0645\u0627\u0644 \u0627\u0644\u0645\u0624\u0633\u0633\u064a \u0628\u0635\u0645\u062a\u0647 \u2014 \u0646\u062d\u0646 \u0646\u062a\u0628\u0639\u0647\u060d',
    win_rate:'\u0645\u0639\u062f\u0644 \u0627\u0644\u0641\u0648\u0632', members:'\u0627\u0644\u0623\u0639\u0636\u0627\u0621', markets:'\u0627\u0644\u0623\u0633\u0648\u0627\u0642',
    inst_hub:'\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u064a\u0632\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u064a\u0629',
    latest_signals:'\u0623\u062d\u062f\u062b \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a',
    view_all_signals:'\u0639\u0631\u0636 \u062c\u0645\u064a\u0639 \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a \u0648\u0627\u0644\u0645\u0645\u064a\u0632 \u2190',
    market_intel:'\u0630\u0643\u0627\u0621 \u0627\u0644\u0633\u0648\u0642',
    loading_news:'\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0623\u062e\u0628\u0627\u0631\u2026',
    news_all:'\u0627\u0644\u0643\u0644', news_macro:'\u0627\u0644\u0627\u0642\u062a\u0635\u0627\u062f \u0627\u0644\u0643\u0644\u064a', news_forex:'\u0641\u0648\u0631\u0643\u0633 \u0648\u0627\u0644\u0630\u0647\u0628', news_stocks:'\u0627\u0644\u0623\u0633\u0647\u0645',
    load_more:'\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0632\u064a\u062f \u2193',
    fear_greed:'\u0627\u0644\u062e\u0648\u0641 \u0648\u0627\u0644\u062c\u0634\u0639',
    sign_in:'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644', sign_up:'\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628',
    google_auth:'\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0645\u0639 Google',
    section_account:'\u062d\u0633\u0627\u0628\u064a', section_premium:'\u0645\u0645\u064a\u0632',
    section_academy:'\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629 \u0627\u0644\u062a\u062f\u0627\u0648\u0644', section_bots:'\u0628\u0648\u062a\u0627\u062a \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a',
    section_community:'\u0627\u0644\u0645\u062c\u062a\u0645\u0639 \u0648\u0627\u0644\u062a\u0648\u0627\u0635\u0644', section_tools:'\u0627\u0644\u0623\u062f\u0648\u0627\u062a',
    section_settings:'\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', section_knowledge:'\u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0648\u0627\u0644\u0646\u0638\u0627\u0645',
    section_contact:'\u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0648\u0627\u0644\u062f\u0639\u0645', section_legal:'\u0642\u0627\u0646\u0648\u0646\u064a',
    upgrade_title:'\u0627\u0644\u062a\u0631\u0642\u064a\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0645\u064a\u0632', upgrade_sub:'\u0625\u0644\u063a\u0627\u0621 \u0642\u0641\u0644 \u062c\u0645\u064a\u0639 \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a\u060c \u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629 \u0643\u0627\u0645\u0644\u0629\u060c \u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0623\u0648\u0644\u0648\u064a\u0629',
    referral_title:'\u0625\u062d\u0627\u0644\u0629 \u0648\u0627\u0631\u0628\u062d', referral_sub:'\u0643\u0644\u0627\u0643\u0645\u0627 \u064a\u062d\u0635\u0644 \u0639\u0644\u0649 7 \u0623\u064a\u0627\u0645 Premium \u0645\u062c\u0627\u0646\u0627\u064b',
    analytics_title:'\u0627\u0644\u062a\u062d\u0644\u064a\u0644\u0627\u062a', analytics_sub:'\u0625\u062d\u0635\u0627\u0621\u0627\u062a \u0627\u0644\u0623\u062f\u0627\u0621 \u00b7 \u0645\u0639\u062f\u0644 \u0627\u0644\u0641\u0648\u0632 \u00b7 \u062a\u062a\u0628\u0639 \u0627\u0644\u0623\u0631\u0628\u0627\u062d',
    signal_alerts_title:'\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a', signal_alerts_sub:'\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0627\u0644\u062f\u0641\u0639 \u00b7 \u062a\u0641\u0636\u064a\u0644\u0627\u062a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a',
    language_title:'\u0627\u0644\u0644\u063a\u0629', install_title:'\u062a\u062b\u0628\u064a\u062a \u0627\u0644\u062a\u0637\u0628\u064a\u0642',
    install_sub:'\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629 \u00b7 \u0627\u0644\u0648\u0635\u0648\u0644 \u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644',
    gwp_title:'\u0645\u0627 \u0647\u0648 GWP\u061f', gwp_sub:'\u0628\u0631\u0648\u062a\u0648\u0643\u0648\u0644 Ghost Wick \u0628\u0640 5 \u0631\u0643\u0627\u0626\u0632 \u0645\u0648\u0636\u062d',
    system_status_title:'\u062d\u0627\u0644\u0629 \u0627\u0644\u0646\u0638\u0627\u0645', system_status_sub:'\u0645\u0628\u0627\u0634\u0631 \u00b7 \u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u062a\u0639\u0645\u0644',
    sign_out:'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c',
    make_money_title:'\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0628\u0648\u0631\u0635\u0629', make_money_sub:'\u0633\u062c\u0644 \u0639\u0628\u0631 \u0634\u0631\u0643\u0627\u0626\u0646\u0627 \u0627\u0644\u0645\u0648\u062b\u0648\u0642\u064a\u0646',
    badge_free:'\u0645\u062c\u0627\u0646\u064a', badge_premium:'\u0643\u062a\u0627\u0628 \u0645\u0645\u064a\u0632',
    no_active_signals:'\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u0634\u0627\u0631\u0627\u062a \u0646\u0634\u0637\u0629 \u0628\u0639\u062f',
    active_signals_desc:'\u064a\u0642\u0648\u0645 \u0627\u0644\u0628\u0648\u062a \u0628\u0645\u0633\u062d \u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0643\u0644 30 \u062f\u0642\u064a\u0642\u0629. \u0633\u062a\u0638\u0647\u0631 \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u0646\u0634\u0637\u0629 \u0647\u0646\u0627 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627.',
    waiting_bot:'\u0641\u064a \u0627\u0646\u062a\u0638\u0627\u0631 \u0625\u0634\u0627\u0631\u0629 \u0627\u0644\u0628\u0648\u062a...',
    free_signals_label:'\u0625\u0634\u0627\u0631\u0627\u062a \u0645\u062c\u0627\u0646\u064a\u0629', free_signals_sub:'3 \u0643\u0627\u0645\u0644\u0629 \u00b7 \u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u0633\u0648\u0627\u0642', premium_signals_label:'\u0625\u0634\u0627\u0631\u0627\u062a \u0645\u0645\u064a\u0632\u0629',
    or_divider:'\u0623\u0648', email_placeholder:'you@email.com', password_placeholder:'\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
    name_placeholder:'\u0627\u0633\u0645\u0643', min_chars:'8 \u0623\u062d\u0631\u0641 \u0643\u062d\u062f \u0623\u062f\u0646\u0649',
    forgot_msg:'\u0623\u062f\u062e\u0644 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0648\u0633\u0646\u0631\u0633\u0644 \u0644\u0643 \u0631\u0627\u0628\u0637 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0639\u064a\u064a\u0646.',
    active_members:'2,800+ \u0645\u062a\u062f\u0627\u0648\u0644 \u0646\u0634\u0637', signal_accuracy:'73%+ \u062f\u0642\u0629 \u0645\u0628\u0627\u0634\u0631\u0629', markets_covered:'3 \u0623\u0633\u0648\u0627\u0642 \u0645\u063a\u0637\u0627\u0629',
    crypto_bot:'\u0628\u0648\u062a \u0625\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u0643\u0631\u064a\u0628\u062a\u0648', forex_bot:'\u0628\u0648\u062a \u0625\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u0641\u0648\u0631\u0643\u0633', stocks_bot:'\u0628\u0648\u062a \u0625\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u0623\u0633\u0647\u0645',
    section_legal:'\u0642\u0627\u0646\u0648\u0646\u064a', course_unlock:'\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0642\u0641\u0644',
    profit:'\u0631\u0628\u062d',
    performance_title:'\u0627\u0644\u0623\u062f\u0627\u0621', performance_sub:'\u062f\u0642\u0629 \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u062a\u0627\u0631\u064a\u062e\u064a\u0629 \u0648\u0627\u0644\u0646\u062a\u0627\u0626\u062c',
    about_title:'\u062d\u0648\u0644 AxTrader', about_sub:'\u0645\u0647\u0645\u062a\u0646\u0627\u060c \u0641\u0631\u064a\u0642\u0646\u0627\u060c \u0628\u0631\u0648\u062a\u0648\u0643\u0648\u0644\u0646\u0627',
    privacy_title:'\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629', privacy_last_updated:'\u0622\u062e\u0631 \u062a\u062d\u062f\u064a\u062b',
  },
  zh: {
    home:'\u9996\u9875', signals:'\u4fe1\u53f7', games:'\u6e38\u620f', news:'\u65b0\u95fb', more:'\u66f4\u591a',
    hero_sub:'',
    win_rate:'\u80dc\u7387', members:'\u6210\u5458', markets:'\u5e02\u573a',
    inst_hub:'\u673a\u6784\u4f18\u52bf\u4e2d\u5fc3',
    latest_signals:'\u6700\u65b0\u4fe1\u53f7',
    view_all_signals:'\u67e5\u770b\u6240\u6709\u4fe1\u53f7\u548c\u9ad8\u7ea7\u7248 \u2192',
    market_intel:'',
    loading_news:'\u52a0\u8f7d\u4e2d\u2026',
    sign_in:'\u767b\u5f55', sign_up:'\u6ce8\u518c',
    google_auth:'\u4f7f\u7528 Google \u7ee7\u7eed',
    section_account:'\u6211\u7684\u8d26\u6237', section_premium:'\u9ad8\u7ea7\u7248',
    section_academy:'\u4ea4\u6613\u5b66\u9662', section_bots:'\u4fe1\u53f7\u673a\u5668\u4eba',
    section_community:'\u793e\u533a', section_tools:'\u5de5\u5177',
    section_settings:'\u8bbe\u7f6e', section_knowledge:'\u77e5\u8bc6\u4e0e\u7cfb\u7edf',
    section_contact:'\u8054\u7cfb\u4e0e\u652f\u6301', section_legal:'\u6cd5\u5f8b',
    upgrade_title:'\u5347\u7ea7\u5230\u9ad8\u7ea7\u7248', upgrade_sub:'',
    referral_title:'\u63a8\u8350\u4e0e\u83b7\u5229', referral_sub:'',
    analytics_title:'\u5206\u6790', analytics_sub:'',
    signal_alerts_title:'', language_title:'', install_title:'', install_sub:'',
    sign_out:''
  }
};

// Current language
let currentLang = 'en';

// Observer callbacks for language changes
const observers = [];

/**
 * Initialize language from localStorage or default to 'en'.
 */
export function initLang() {
  try {
    const saved = localStorage.getItem('ax_lang');
    if (saved && LANGUAGES.includes(saved)) {
      currentLang = saved;
    }
  } catch {}
  applyDirection();
  return currentLang;
}

/**
 * Get current language code.
 */
export function getLang() {
  return currentLang;
}

/**
 * Translate a key. Falls back to English, then the key itself.
 */
export function t(key) {
  return (i18n[currentLang]?.[key]) || (i18n.en?.[key]) || key;
}

/**
 * Set application language.
 */
export function setLang(lang) {
  if (!LANGUAGES.includes(lang)) return;
  currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  applyDirection();
  observers.forEach(cb => cb(lang));
  // Update html lang attribute
  document.documentElement.lang = lang;
  // Update auth lang selector if present
  const sel = document.getElementById('auth-lang');
  if (sel) sel.value = lang;
}

/**
 * Translate all elements in the DOM that have a data-i18n attribute.
 */
export function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = value;
    } else {
      el.textContent = value;
    }
  });
}

/**
 * Register an observer for language changes.
 */
export function onLangChange(cb) {
  observers.push(cb);
}

/**
 * Apply RTL direction for Arabic.
 */
function applyDirection() {
  const isRTL = RTL_LANGS.has(currentLang);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
}

export { i18n as dictionary };
