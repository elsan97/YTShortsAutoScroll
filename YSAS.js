// ==UserScript==
// @name         YouTube Shorts Auto Scroll
// @namespace    https://github.com/elsan97/YTShortsAutoScroll
// @version      1.0
// @description  Автопрокрутка Shorts с мини-панелью в правом верхнем углу
// @author       Elsan97YT
// @match        https://www.youtube.com/shorts/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'yt_shorts_autoscroll_v4';
    let isEnabled = localStorage.getItem(STORAGE_KEY) !== 'false';

    let isCooldown = false;

    let panel = null;
    let toggleEl = null;
    let knobEl = null;
    let labelEl = null;
    let indicatorEl = null;
    let currentVideo = null;
    let lastTime = 0;

    function createPanel() {
        if (document.getElementById('yt-shorts-autoscroll-panel')) return;

        panel = document.createElement('div');
        panel.id = 'yt-shorts-autoscroll-panel';
        panel.style.cssText = `
            position: fixed;
            top: 100px;
            right: 90px;
            z-index: 99999;
            background: rgba(28, 28, 28, 0.9);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 14px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.12);
            font-family: "Roboto", "YouTube Sans", sans-serif;
            font-size: 12px;
            color: #fff;
            user-select: none;
            transition: opacity 0.2s;
            pointer-events: auto;
        `;

        indicatorEl = document.createElement('span');
        indicatorEl.textContent = isEnabled ? '●' : '○';
        indicatorEl.style.cssText = `
            font-size: 14px;
            line-height: 1;
            color: ${isEnabled ? '#ff0000' : '#888'};
        `;

        labelEl = document.createElement('span');
        labelEl.textContent = isEnabled ? 'AUTO' : 'OFF';
        labelEl.style.cssText = `
            font-weight: 600;
            letter-spacing: 0.5px;
            color: ${isEnabled ? '#fff' : '#888'};
        `;

        toggleEl = document.createElement('div');
        toggleEl.style.cssText = `
            width: 38px;
            height: 20px;
            border-radius: 10px;
            background: ${isEnabled ? '#fff' : '#555'};
            position: relative;
            cursor: pointer;
            transition: background 0.2s;
            flex-shrink: 0;
        `;

        knobEl = document.createElement('div');
        knobEl.style.cssText = `
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${isEnabled ? '#ff0000' : '#aaa'};
            position: absolute;
            top: 2px;
            left: ${isEnabled ? '20px' : '2px'};
            transition: left 0.2s, background 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        `;
        toggleEl.appendChild(knobEl);

        toggleEl.addEventListener('click', (e) => {
            e.stopPropagation();
            isEnabled = !isEnabled;
            localStorage.setItem(STORAGE_KEY, isEnabled);
            updateUI();
        });

        panel.addEventListener('mousedown', (e) => e.stopPropagation());
        panel.addEventListener('click', (e) => e.stopPropagation());

        panel.appendChild(indicatorEl);
        panel.appendChild(labelEl);
        panel.appendChild(toggleEl);
        document.body.appendChild(panel);
    }

    function updateUI() {
        if (!toggleEl) return;
        indicatorEl.textContent = isEnabled ? '●' : '○';
        indicatorEl.style.color = isEnabled ? '#ff0000' : '#888';
        labelEl.textContent = isEnabled ? 'AUTO' : 'OFF';
        labelEl.style.color = isEnabled ? '#fff' : '#888';
        toggleEl.style.background = isEnabled ? '#fff' : '#555';
        knobEl.style.left = isEnabled ? '20px' : '2px';
        knobEl.style.background = isEnabled ? '#ff0000' : '#aaa';
    }

    function getNextButton() {
        const selectors = [
            '#navigation-button-down button[aria-label="Следующее видео"]',
            '#navigation-button-down button[aria-label="Next video"]',
            '#navigation-button-down button',
            'button[aria-label="Следующее видео"]',
            'button[aria-label="Next video"]'
        ];
        for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn) return btn;
        }
        return null;
    }

    function getActiveVideo() {
        return document.querySelector('#shorts-player video');
    }

    function onTimeUpdate() {
        if (!isEnabled || isCooldown) return;

        const video = currentVideo;
        if (!video || !video.duration || video.duration === Infinity) return;

        const t = video.currentTime;
        const d = video.duration;

        const nearEnd = t > 0 && (d - t) < 0.5;

        const loopedBack = lastTime > 1 && t < lastTime - 1;

        lastTime = t;

        if (nearEnd || loopedBack) {
            const btn = getNextButton();
            if (btn) {
                isCooldown = true;

                btn.click();

                setTimeout(() => {
                    isCooldown = false;
                    lastTime = 0;
                }, 1500);
            }
        }
    }

    function attachToVideo() {
        const video = getActiveVideo();
        if (!video || video === currentVideo) return;

        if (currentVideo) {
            currentVideo.removeEventListener('timeupdate', onTimeUpdate);
        }

        currentVideo = video;
        lastTime = video.currentTime || 0;
        video.addEventListener('timeupdate', onTimeUpdate);
    }

    const observer = new MutationObserver(() => {
        createPanel();
        attachToVideo();
    });

    function init() {
        createPanel();
        attachToVideo();

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['is-active', 'src']
        });

        setInterval(() => {
            createPanel();
            attachToVideo();
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
