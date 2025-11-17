import React from 'react';

import * as S from './style';
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
        <S.Container>
            <S.Title>Anatolii Kurochkin</S.Title>
            <S.Subtitle>Software Engineer</S.Subtitle>
            <S.Face>
                <S.FaceImg src={faceImage} alt="Avatar" />
            </S.Face>
            <S.SocialMediaList>
                {socialMediaList.map(({ id, Component, url }) => {
                    return (
                        <S.SocialMedia key={id} href={url} target="_blank">
                            <Component />
                        </S.SocialMedia>
                    );
                })}
            </S.SocialMediaList>
            <S.Copyright>Created with ❤️</S.Copyright>
        </S.Container>
    );
};

export default Main;
