import Image from 'next/image';

import styles from './Main.module.scss';
import faceImage from './images/face.png';
import { GitHub } from './icons/GitHub';
import { Facebook } from './icons/Facebook';
import { Instagram } from './icons/Instagram';
import { Linkedin } from './icons/Linkedin';
import { Resume } from './icons/Resume';

const socialMediaList = [
    { id: 'resume', Component: Resume, url: '/docs/anatolii-kurochkin-resume.pdf' },
    { id: 'github', Component: GitHub, url: 'https://github.com/anatoliisf' },
    { id: 'linkedin', Component: Linkedin, url: 'https://www.linkedin.com/in/anatoliisf' },
    { id: 'instagram', Component: Instagram, url: 'https://www.instagram.com/anatoliisf' },
    { id: 'facebook', Component: Facebook, url: 'https://www.facebook.com/anatoliisf' },
];

const Main = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Nate Kurochkin</h1>
            <div className={styles.subtitle}>Software Engineer</div>
            <div className={styles.face}>
                <Image className={styles.faceImg} fill sizes="100vw" loading="eager" src={faceImage} alt="Avatar" />
            </div>
            <div className={styles.socialMediaList}>
                {socialMediaList.map(({ id, Component, url }) => {
                    return (
                        <a key={id} href={url} target="_blank" className={styles.socialMedia}>
                            <Component />
                        </a>
                    );
                })}
            </div>
            <div className={styles.copyright}>Created with ❤️</div>
        </div>
    );
};

export default Main;
