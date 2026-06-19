import type { FooterLinkGroup, SocialLink } from "../domain/types";
import { copyrightYear } from "../domain/logic";
import styles from "./Footer.module.css";

interface FooterProps {
  groups: FooterLinkGroup[];
  socialLinks: SocialLink[];
  onOpenPage: (href: string) => void;
}

export function Footer({ groups, socialLinks, onOpenPage }: FooterProps) {
  const year = copyrightYear(new Date());

  return (
    <footer className={styles.footer}>
      <div className={styles.groups}>
        {groups.map((group) => (
          <div key={group.label} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.label}</h3>
            <ul className={styles.linkList}>
              {group.links.map((link) => (
                <li key={link.href}>
                  <button
                    className={styles.link}
                    onClick={() => onOpenPage(link.href)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Suivez-nous</h3>
          <ul className={styles.social}>
            {socialLinks.map((s) => (
              <li key={s.platform}>
                <a
                  className={styles.link}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.platform}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className={styles.copyright}>
        © {year} ShopTaSapp. Tous droits réservés.
      </p>
    </footer>
  );
}
