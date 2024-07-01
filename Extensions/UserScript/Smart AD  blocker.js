// ==UserScript==
// @name         Smart AD blocker for: Yandex, Mail.ru
// @name:ru         Умный блокировщик рекламы для: Yandex, Mail.ru
// @namespace    http://tampermonkey.net/
// @version      2024-07-01_22-24
// @description  Smart AD blocker with dynamic blocking protection, for: Yandex, Mail.ru
// @description:ru  Умный блокировщик рекламы при динамической защите от блокировки, для: Yandex, Mail.ru
// @author       Igor Lebedev
// @license        GPL-3.0-or-later
// @match        http://*.mail.ru/*
// @match        https://*.mail.ru/*
// @match        https://*.ya.ru/*
// @match        https://*.yandex.ru/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/499243/Smart%20AD%20blocker%20for%3A%20Yandex%2C%20Mailru.user.js
// @updateURL https://update.greasyfork.org/scripts/499243/Smart%20AD%20blocker%20for%3A%20Yandex%2C%20Mailru.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // получаем текущий адрес страницы
    const currentURL = window.location.href
    const config = {
        SettingsOnOff: true,
        isRunningAsExtension: false,
        nodes: {
            mail_ru_email_GeneralBlock: 'div.application-mail__layout.application-mail__layout_main',
            mail_ru_suggestions: 'div.themes-widget.themes-widget_full',
            mail_ru_banner_top_parent: 'div[slot="main-column"]',
            mail_ru_banner_top_parent_bannerClassList: ['span', 'article', 'p', 'section'], // все возможные типы нод, используемые в качестве контекнера рекламного баннера
            ya_ru_banner_under_search: 'div.banner.i-mini-bem', // все возможные типы нод, используемые в качестве контекнера рекламного баннера
            ya_ru_search_suggestions: 'div.Modal.Modal_visible.Modal_hasAnimation.Distribution-SplashScreenModal.Distribution-SplashScreenModal_outerCross.SplashscreenDefault', // все возможные типы нод, используемые в качестве контекнера рекламного баннера


        }
    };
    let intervalId

    // Функция для проверки наличия целевой ноды
    function checkForTargetNode() {
        const observer_config = { childList: true, subtree: true };

        if (currentURL.startsWith('https://e.mail.ru/')) {



            function checkFor_GeneralBlock() {
                const targetNode = document.querySelector(config.nodes.mail_ru_email_GeneralBlock);

                if (targetNode) {
                    clearInterval(interval_GeneralBlock)
                    checkAndRemoveRightBlock(targetNode)
                    checkAndRemoveTopBlock(targetNode)
                    checkAndRemoveMailruSuggestions(null)

                    // Настраиваем наблюдение за изменениями в документе
                    const observer = new MutationObserver((mutationsList, observer) => {
                        for (let mutation of mutationsList) {
                            if (mutation.type === 'childList') {
                                // checkAndRemoveRightBlock(mutation);
                                // checkAndRemoveTopBlock(mutation);

                                mutation.removedNodes.forEach(node => {
                                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('div.portal-menu-element.portal-menu-element_select.portal-menu-element_expanded.portal-menu-element_not-touch.portal-menu-element_pony-mode')) {
                                        checkAndRemoveRightBlock(mutation);
                                        checkAndRemoveTopBlock(mutation);
                                    }
                                });
                                mutation.addedNodes.forEach(node => {
                                    if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'A') {
                                        checkAndRemoveMailruSuggestions(mutation)

                                    }
                                });

                            }
                        }
                    });
                    observer.observe(targetNode, observer_config);

                }
            }
            // Функция для проверки наличия и удаления блока рекламного банера Майлру в нижнем левом углу
            function checkAndRemoveMailruSuggestions(mutation) {
                const targetNode = document.querySelector(config.nodes.mail_ru_suggestions);
                if (targetNode) {
                    // clearInterval(interval_MailruSuggestions); // Останавливаем интервал, так как элемент уже найден
                    targetNode.remove()
                }
            }
            const interval_GeneralBlock = setInterval(checkFor_GeneralBlock, 200);

        }

        else if (currentURL.startsWith('https://mail.ru/')) {
            mail_ru_checkAndRemoveTopBlock()

            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // console.log('Новые узлы добавлены:', mutation.addedNodes);
                        // для всех возможных типов нод-контейнеров баннера
                        config.nodes.mail_ru_banner_top_parent_bannerClassList.forEach(item => {
                            // mail_ru_checkAndRemoveTopBlock()
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeName === item.toUpperCase()) {
                                    mail_ru_checkAndRemoveTopBlock_classList(node,mutation)
                                }
                            });
                        });

                    }
                }
            });
            observer.observe(document.querySelector(config.nodes.mail_ru_banner_top_parent), observer_config);

        }
        else if (currentURL.startsWith('https://ya.ru/search/')) {
            const targetNode = document.querySelector(config.nodes.ya_ru_search_suggestions)
            targetNode?.remove()
        }
        else if (currentURL.startsWith('https://ya.ru/')) {
            const targetNode = document.querySelector(config.nodes.ya_ru_banner_under_search)
            targetNode?.remove()
            const dist_stripe = document.querySelector("div.dist-stripe")
            dist_stripe?.parentNode.remove()

        }
        // каталог игр
        else if (currentURL.startsWith('https://yandex.ru/games/') && !currentURL.startsWith('https://yandex.ru/games/app/')) {
            // реклама в каталоге игр
            function AD_remove_node(node, mutation_test) {
                const nodeDiv = node.querySelector('div')
                // Проверяем, является ли элемент div и не содержит ли он указанные классы
                if (nodeDiv &&
                    !nodeDiv.classList.contains('feed_block_suggested') &&
                    !nodeDiv.classList.contains('feed_block_categorized')) {
                    clearInterval(interval_AD_remove)
                    node.remove()
                }
            }
            function AD_remove() {
                const targetNodes = document.querySelectorAll('div.page__page.main-page > div#feeds > div.adaptive-width')
                targetNodes?.forEach(node => {
                    AD_remove_node(node)
                });
            }
            const interval_AD_remove = setInterval(AD_remove, 500);

            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // console.log('Новые узлы добавлены:', mutation.addedNodes);
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeName === 'DIV' &&
                                node.className === 'adaptive-width') {
                                AD_remove_node(node, mutation)
                            }
                        });

                    }
                }
            });
            observer.observe(document.querySelector('div.page__right'), observer_config);
        }
        // на странице игры
        else if (currentURL.startsWith('https://yandex.ru/games/app/')) {
            // центральный баннер
            function AD_center_remove() {
                const targetNodes = document.querySelectorAll('div.play-modal_with-blur')
                if (targetNodes.length > 0) {
                    clearInterval(interval_AD_center_remove)
                    targetNodes.forEach(node => {
                        // Проверяем, является ли элемент div и не содержит ли он указанные классы

                        // node.parentNode.remove()
                        node.parentNode.style.display = 'none'
                        // node.querySelector('span.Icon')?.click()

                    });
                }
                // const targetNode = document.querySelector('div.prowo-container_with-blur > div.prowo__wrapper > div.prowo > span.Icon.Icon_size_m.close-button') || document.querySelector('div.play-modal__inner > div > span.Icon.Icon_size_m.close-button')
                // if (targetNode) {
                //     // clearInterval(interval_AD_center_remove)
                //     targetNode.click()
                // }
            }
            const interval_AD_center_remove = setInterval(AD_center_remove, 500);
            // правый блок рекламы
            function RiggtBlock_remove() {
                const targetNode_RiggtBlock = document.querySelector('div.stack > div')
                if (targetNode_RiggtBlock) {
                    clearInterval(interval_RiggtBlock_remove)
                    targetNode_RiggtBlock.remove()
                }
            }
            const interval_RiggtBlock_remove = setInterval(RiggtBlock_remove, 500);
            // кнопка "Отключить рекламу"
            const targetStackDivs = document.querySelectorAll('div.stack > div')
            targetStackDivs?.forEach(node => {
                // Проверяем, заканчивается ли класс на __desktop-disable-ad-button-wrapper
                node.classList.forEach(className => {
                    if (className.endsWith('__desktop-disable-ad-button-wrapper')) {
                        node.parentNode.remove();
                    }
                });
            });


        }
        // почтовый ящик
        else if (currentURL.startsWith('https://mail.yandex.ru/')) {
            // реклама внизу слева

            function AD_remove_node(node, mutation_test) {
                // Проверяем, не содержит ли node он указанные классы
                if (!node.classList.contains('ns-view-react-left-column') &&
                    !node.classList.contains('ns-view-fill-height-placeholder-box') &&
                    !node.classList.contains('ns-view-skin-saver-box') &&
                    !node.classList.contains('ns-view-copyright-box')) {
                    node.remove()
                }
            }
            function AD_remove() {
                const targetNode = document.querySelector('div.ns-view-left-box.mail-Layout-Aside-Inner-Box.js-layout-aside-inner-box[data-key="box=left-box"]')
                if (targetNode) {
                    clearInterval(interval_AD_remove)
                    const observer = new MutationObserver((mutationsList, observer) => {
                        for (let mutation of mutationsList) {
                            if (mutation.type === 'childList') {
                                // console.log('Новые узлы добавлены:', mutation.addedNodes);
                                mutation.addedNodes.forEach(node => {
                                    if (node.nodeName === 'DIV' &&
                                       node.parentNode === targetNode) {
                                        AD_remove_node(node, mutation)
                                    }
                                });

                            }
                        }
                    });
                    observer.observe(targetNode, observer_config);

                    const targetNodes = targetNode.querySelectorAll('div')
                    targetNodes?.forEach(node => {
                        AD_remove_node(node)
                    });
                }

            }
            const interval_AD_remove = setInterval(AD_remove, 500);
        }
    }


    // https://e.mail.ru/inbox/
    // Функция для проверки наличия и удаления правого блока
    function checkAndRemoveRightBlock(mutation_test) {
        // блок опрделяется непосредственно перед анализом так как иначе теряется
        const targetNode = document.querySelector(config.nodes.mail_ru_email_GeneralBlock);
        const span = targetNode.querySelector('span');
        if (span) {
            const RightBlock = span.querySelector('div.layout__column.layout__column_right.layout__column_right-indented');
            if (RightBlock) {
                RightBlock.remove();
            }
            else {
                // const divs = span.querySelectorAll('div');
                // Получаем непосредственные дочерние элементы
                const divs = span.children;

                // Перебираем дочерние элементы
                if (divs.length === 3) {
                    for (let div of divs) {
                        const classList = Array.from(div.classList);
                        if (classList.length === 3 &&
                            classList.some(className => className.length === 7) &&
                            classList.some(className => className.length === 15) &&
                            classList.some(className => className.length === 15)) {
                            // console.log('Найден и удален div:', div);
                            div.remove();
                            break;
                        }
                    }
                }
            }
        }
    }
    // https://e.mail.ru/inbox/
    // Функция для проверки наличия и удаления верхнего блока
    function checkAndRemoveTopBlock(mutation_test) {
        // блок опрделяется непосредственно перед анализом так как иначе теряется
        const targetNode = document.querySelector(config.nodes.mail_ru_email_GeneralBlock);
        const span = targetNode.querySelector('span');
        if (span) {
            // const divs = span.querySelectorAll('div');
            // Получаем непосредственные дочерние элементы
            const divs = span.children;

            // Перебираем дочерние элементы
            for (let div of divs) {
                const classList = Array.from(div.classList);
                if (classList.length === 1 &&
                    classList.some(className => className.length === 7) ) {

                    const DivBlock = div.querySelector('div > div > div > div > div > div > div')
                    const DivBlockclassList = Array.from(DivBlock.classList);
                    if (DivBlockclassList.length === 3 &&
                        DivBlockclassList.some(className => className.length === 7) &&
                        DivBlockclassList.some(className => className.length === 15) &&
                        DivBlockclassList.some(className => className.length === 15)) {
                        // console.log('Найден и удален div:', div);
                        DivBlock.remove();
                        break;
                    }
                }
            }
        }
    }

    // https://mail.ru/
    // Функция для проверки наличия и удаления верхнего рекламного блока
    function mail_ru_checkAndRemoveTopBlock() {
        const targetNode = document.querySelector(config.nodes.mail_ru_banner_top_parent);
        if (targetNode) {
            // тип ноды меняется через каждые несколько секунд
            let targetNode_banner

            targetNode_banner = targetNode.querySelector('div.tgb-wrapper')

            if (targetNode_banner) {
                targetNode_banner.remove()
            }
            // });

        }
    }

    function mail_ru_checkAndRemoveTopBlock_classList(Node,mutation_test) {
        const classList = Array.from(Node.classList);
        if (classList.length === 3 &&
            classList.some(className => className.length === 7) &&
            classList.some(className => className.length === 7) &&
            classList.some(className => className.includes('-') )) { // замечены варианты 15 и 17 длиной
            Node.remove();
            // Node.style.display = 'none';

        }
    }

    checkForTargetNode()


})();
