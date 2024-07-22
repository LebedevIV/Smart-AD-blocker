// ==UserScript==
// @name         Smart AD blocker for: Yandex, Mail.ru, Dzen.ru, VK, OK
// @name:ru         Умный блокировщик рекламы для: Yandex, Mail.ru, Dzen.ru, VK, OK
// @namespace    http://tampermonkey.net/
// @version      2024-07-22_17-18
// @description  Smart AD blocker with dynamic blocking protection, for: Yandex, Mail.ru, Dzen.ru, VK, OK
// @description:ru  Умный блокировщик рекламы при динамической защите от блокировки, для: Yandex, Mail.ru, Dzen.ru, VK, OK
// @author       Igor Lebedev
// @license        GPL-3.0-or-later
// @match        http://*.mail.ru/*
// @match        https://*.mail.ru/*
// @match        https://*.ya.ru/*
// @match        https://*.yandex.ru/*
// @match        https://*.ok.ru/*
// @match        https://*.vk.com/*
// @match        https://dzen.ru/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/499243/Smart%20AD%20blocker%20for%3A%20Yandex%2C%20Mailru%2C%20Dzenru%2C%20VK%2C%20OK.user.js
// @updateURL https://update.greasyfork.org/scripts/499243/Smart%20AD%20blocker%20for%3A%20Yandex%2C%20Mailru%2C%20Dzenru%2C%20VK%2C%20OK.meta.js
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
                    mail_ru_checkAndRemoveTopBlock()

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
                                        mail_ru_checkAndRemoveTopBlock()

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
        else if (currentURL.startsWith('https://ya.ru/search') || currentURL.startsWith('https://yandex.ru/search')) {
            function AD_remove_node(node, mutation_test) {
                // баннер внизу справа "Сделать Яндекс основным поисковиком?"
                let targetNode
                targetNode = document.querySelector(config.nodes.ya_ru_search_suggestions)
                targetNode?.remove()
                targetNode = document.querySelector('div.Distribution-Popup')
                targetNode?.remove()
                // вверху слева кнопка "Установите Яндекс Браузер"
                targetNode = document.querySelector('div.DistrNav') || document.querySelector('div.HeaderDesktopActions-Distribution')
                targetNode?.remove()
            }
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeName === 'DIV') {
                                AD_remove_node(node, mutation)
                            }
                        });

                    }
                }
            });
            observer.observe(document.body, observer_config);
            AD_remove_node()


        }
        // настроить обсервер
        else if (currentURL.startsWith('https://ya.ru/images/') || currentURL.startsWith('https://yandex.ru/images/')) {
            // блок справа
            function AD_remove_node(node, mutation_test) {
                let targetNode
                // баннер "Сделать Яндекс основным поисковиком?"
                targetNode = document.querySelector(config.nodes.ya_ru_search_suggestions)
                targetNode?.remove()
                // баннер справа
                targetNode = document.querySelector('div.ImagesViewer-SidebarAdv')
                targetNode?.parentNode.remove()
                targetNode = document.querySelector('div#ImagesViewer-SidebarAdv')
                targetNode?.parentNode.parentNode.parentNode.remove()
                // баннер вверху
                targetNode = document.querySelector('div.AdvMastHead')
                targetNode?.remove()
                // if (node) observer.disconnect()

            }
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeName === 'DIV') {
                                AD_remove_node(node, mutation)
                            }
                        });

                    }
                }
            });
            observer.observe(document.body, observer_config);
            AD_remove_node()

        }

        // настроить обсервер
        // сделать пропуск видеозаставки
        else if (currentURL.startsWith('https://ya.ru/video/')) {
            // баннер сверху
            function AD_remove_node(node, mutation_test) {
                const targetNodes = document.querySelectorAll('div[role="button"]')
                targetNodes?.forEach(node => {
                    node.remove()
                });
            }
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeName === 'DIV') {
                                const targetNodes = document.querySelectorAll('div[role="button"]')
                                targetNodes?.forEach(node => {
                                    node.remove()
                                });
                            }
                        });

                    }
                }
            });
            observer.observe(document.body, observer_config);
            AD_remove_node()
            yandex_dzen_questionYandexGeneralSearch()

        }
        else if (currentURL.startsWith('https://ya.ru/')) {
            // Добавление кнопки "Специально для Вас..."
            const EspeciallyForYou = CreateEspeciallyForYou()
            // const EspeciallyForYou_Content = EspeciallyForYou.querySelector('div.shimmer')


            // Удаление без наблюдения
            // перенос всей рекламы в специальный фрейм "Специально для Вас..."
            // const headline__personal = document.querySelector('div.headline__personal')
            let targetNode
            // курсы валют и нефти (сделать опциональным)
            targetNode = document.querySelector('section.informers3__stocks')
            // targetNode?.remove()
            if (targetNode) {
                targetNode.style.marginTop = '0.3rem'
                EspeciallyForYou?.appendChild(targetNode)
            }
            targetNode = document.querySelector(config.nodes.ya_ru_banner_under_search)
            // targetNode?.remove()
            if (targetNode) EspeciallyForYou?.appendChild(targetNode)
            const dist_stripe = document.querySelector("div.dist-stripe")
            // dist_stripe?.parentNode.remove()
            if (targetNode) EspeciallyForYou?.appendChild(targetNode)

            // Добавление EspeciallyForYou под блок поля поиска
            const ForEspeciallyForYou_Container = document.querySelector('div.body__content')
            if (ForEspeciallyForYou_Container && EspeciallyForYou.parentNode !== ForEspeciallyForYou_Container) {
                ForEspeciallyForYou_Container.appendChild(EspeciallyForYou)
            }

            const mainElement = document.querySelector('main.body__wrapper');
            if (mainElement) {
                const targetNode = mainElement.querySelector('div[data-hydration-id] > div.dist-stripe');
                if (targetNode) EspeciallyForYou?.appendChild(targetNode.parentNode)
            }

            // Удаление с наблюдением
            function AD_remove_node(node, mutation_test) {
                // Кнопка "Установить Яндекс.браузер"
                let targetNode = document.querySelector('div.link-bro')
                if (targetNode && targetNode.parentNode !== EspeciallyForYou) {
                    if (EspeciallyForYou.querySelector('div.link-bro')) {
                        targetNode?.remove()
                    }
                    else {
                        targetNode.style.position = 'unset'
                        targetNode.style.marginTop = '0.3rem'
                        const targetNodeA = targetNode.querySelector('a')
                        if (targetNodeA) targetNodeA.style.marginBottom = 0
                        EspeciallyForYou?.appendChild(targetNode)
                    }
                }
            }
            function AD_remove() {
                const targetNode = document.querySelector('div.search3__inner') // более точный блок для наблюдения изменений
                if (targetNode) {
                    clearInterval(interval_AD_remove)
                    AD_remove_node()
                    const observer = new MutationObserver((mutationsList, observer) => {
                        for (let mutation of mutationsList) {
                            if (mutation.type === 'childList') {
                                mutation.addedNodes.forEach(node => {
                                    if (node.nodeName === 'DIV') {
                                        AD_remove_node(node, mutation)
                                    }
                                });
                            }
                        }
                    });
                    observer.observe(targetNode, observer_config)
                }
            }
            const interval_AD_remove = setInterval(AD_remove, 500)

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
        // почтовый ящик
        else if (currentURL.startsWith('https://yandex.ru/maps/')) {
            // реклама справа
            function AD_remove_first() {
                // реклама справа
                const RightBlockFromImages = document.querySelector('div[data-chunk="promo"]')
                if (RightBlockFromImages) RightBlockFromImages.parentNode.parentNode.parentNode.remove()
                // реклама слева
                const LeftBlock = document.querySelector('div.banner-view')
                if (LeftBlock) LeftBlock.parentNode.parentNode.parentNode.remove()
                // маленькая рекламная кнопка сверху
                const TopBlock = document.querySelector('div.map-controls__additional-button')
                if (TopBlock) TopBlock.parentNode.remove()
                const LeftBlockFromPlaces = document.querySelector('div.banner-view')
                if (LeftBlockFromPlaces) LeftBlockFromPlaces.parentNode.remove()
            }
            // требует донастройки
            function AD_remove() {
                // const targetNode = document.querySelector('div._has-banner') // более глобальный блок
                const targetNode = document.querySelector('div.banner-view') // более точный блок
                if (targetNode) {
                    clearInterval(interval_AD_remove)
                    AD_remove_first()
                    const observer = new MutationObserver((mutationsList, observer) => {
                        for (let mutation of mutationsList) {
                            if (mutation.type === 'childList') {
                                mutation.addedNodes.forEach(node => {
                                    if (node.nodeName === 'DIV') {
                                        AD_remove_first()
                                    }
                                });
                            }
                        }
                    });
                    observer.observe(targetNode, observer_config);
                }
            }
            const interval_AD_remove = setInterval(AD_remove, 500);


        }
        // Яндекс.погода: карта
        else if (currentURL.startsWith('https://dzen.ru/pogoda/maps/')) {
            // внизу справа "Сделать поиск Яндекса основным?"
            yandex_dzen_questionYandexGeneralSearch()

            // реклама слева
            const targetNode_leftColumn = document.querySelector('div.weather-maps__ad.weather-maps__ad_visible_yes.map-left-pane__ad')
            if (targetNode_leftColumn) {
                targetNode_leftColumn.remove()
            }

        }
        // Яндекс.погода: сводка
        else if (currentURL.startsWith('https://dzen.ru/pogoda/?via=hl') || currentURL.startsWith('https://dzen.ru/pogoda/details') || currentURL.startsWith('https://dzen.ru/pogoda/?')) {

            // реклама справа
            const targetNode_rightColumn = document.querySelector('div#content_right.content__right')
            if (targetNode_rightColumn) {
                targetNode_rightColumn.remove()
            }

            // реклама в теле страницы
            // первый блок
            const DivsTopAD = document.querySelector('div.adv_pos_index-details_top');
            if (DivsTopAD) {
                DivsTopAD.parentNode.remove()
            }
            // последующие блоки
            // Выбираем все div
            const allDivs = document.querySelectorAll('article.card.card_without-card-decoration');
            allDivs.forEach(div => {
                div.remove();
            });
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // console.log('Новые узлы добавлены:', mutation.addedNodes);
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeName === 'STYLE') {
                                const allDivs = document.querySelectorAll('article.card.card_without-card-decoration');
                                allDivs.forEach(div => {
                                    div.remove();
                                });
                            }
                        });

                    }
                }
            });
            observer.observe(document.body, observer_config);

            yandex_dzen_questionYandexGeneralSearch()

        }
        // Яндекс.погода: на месяц
        else if (currentURL.startsWith('https://dzen.ru/pogoda/month')) {

            // реклама справа страницы
            let targetNode_rightColumn
            targetNode_rightColumn = document.querySelector('section.content__section.content__section_type_adv')
            if (targetNode_rightColumn) {
                targetNode_rightColumn.remove()
            }
            targetNode_rightColumn = document.querySelector('div.climate-calendar-container__adv-wide')
            if (targetNode_rightColumn) {
                targetNode_rightColumn.remove()
            }
        }
        // Дзен.Статьи
        // брать за образец в случае рекламы внутри наблюдаемой ноды
        else if (currentURL.startsWith('https://dzen.ru/a/')) {
            let targetNode_observer
            function AD_remove_node(node, mutation_test) {
                const targetNodes = targetNode_observer.querySelectorAll('aside:not(.navigation-sidebar__container-TO)') || targetNode_observer.querySelectorAll('div.article-right-ad-block__sticky') || targetNode_observer.querySelectorAll('ya-recommendation-widget') || targetNode_observer.querySelectorAll('article-right-ad-block__sticky')
                targetNodes.forEach(node => {
                    node.remove();
                });
            }
            function AD_remove() {
                targetNode_observer = document.querySelector('div#page-root') // более точный блок для наблюдения изменений
                if (targetNode_observer) {
                    clearInterval(interval_AD_remove)
                    AD_remove_node()
                    const observer = new MutationObserver((mutationsList, observer) => {
                        for (let mutation of mutationsList) {
                            if (mutation.type === 'childList') {
                                mutation.addedNodes.forEach(node => {
                                    if (node.nodeName === 'DIV') {
                                        AD_remove_node(node, mutation)
                                    }
                                });
                            }
                        }
                    });
                    observer.observe(targetNode_observer, observer_config);
                }
            }
            const interval_AD_remove = setInterval(AD_remove, 500);

        }
        // Дзен: общее
        // брать за образец в случае хаотичной рекламы
        else if (currentURL.startsWith('https://dzen.ru/')) {
            // Добавление кнопки "Специально для Вас..."
            const EspeciallyForYou = CreateEspeciallyForYou()
            let targetNode_observer

            function AD_remove_node(node, mutation_test) {
                let targetNode
                let targetNodes
                // курсы валют и нефти (сделать опциональным)
                targetNode = document.querySelector('div.header-widgets__rates-ii')
                if (targetNode && targetNode.parentNode !== EspeciallyForYou) {
                    if (EspeciallyForYou.querySelector('div.header-widgets__rates-ii')) {
                        targetNode?.remove()
                    }
                    else {
                        targetNode.style.position = 'unset'
                        targetNode.style.marginTop = '0.3rem'
                        const targetNodeA = targetNode.querySelector('a')
                        if (targetNodeA) targetNodeA.style.marginBottom = 0
                        EspeciallyForYou?.appendChild(targetNode)
                    }
                }

                // Кнопка "Установить Яндекс.браузер"
                targetNode = document.querySelector('div#ya-dist-link_bro') || document.querySelector('div#ya-dist-teaser')
                if (targetNode && targetNode.parentNode !== EspeciallyForYou) {
                    if (EspeciallyForYou.querySelector('div#ya-dist-link_bro') || EspeciallyForYou.querySelector('div#ya-dist-teaser')) {
                        targetNode?.remove()
                    }
                    else {
                        targetNode.style.position = 'unset'
                        targetNode.style.marginTop = '0.3rem'
                        const targetNodeA = targetNode.querySelector('a')
                        if (targetNodeA) targetNodeA.style.marginBottom = 0
                        EspeciallyForYou?.appendChild(targetNode)
                    }
                }
                // баннер сверху
                targetNodes = document.querySelectorAll('div[data-testid="ad-banner"]')
                if (targetNodes.length > 0) {
                    const targetNodes_EspeciallyForYou = EspeciallyForYou.querySelectorAll('div[data-testid="ad-banner"]')
                    if (targetNodes_EspeciallyForYou.length > 0) {
                        targetNodes.forEach(node => {
                            if (node.parentNode !== EspeciallyForYou) {
                                node.remove()
                            }
                        })
                    }
                    else {
                        targetNodes.forEach(node => {
                            node.style.marginTop = '0.3rem'
                            EspeciallyForYou?.appendChild(node)
                        })
                    }
                }
                // реклама в видеоблоках
                targetNodes = document.querySelectorAll('div.zenad-card-rtb__ad')
                targetNodes.forEach(node => {
                    if (node.parentNode !== EspeciallyForYou) {
                        node.style.marginTop = '0.3rem'
                        EspeciallyForYou?.appendChild(node)
                    }
                })

                // Добавление EspeciallyForYou под блок поля поиска
                const ForEspeciallyForYou_Container = document.querySelector('div#banner-view') || document.querySelector('div#LayoutTopMicroRoot')
                if (ForEspeciallyForYou_Container && EspeciallyForYou.parentNode !== ForEspeciallyForYou_Container) {
                    ForEspeciallyForYou_Container.appendChild(EspeciallyForYou)
                }

            }
            // Удаление с наблюдением
            function AD_remove() {
                targetNode_observer = document.querySelector('div#banner-view') || document.querySelector('div#LayoutTopMicroRoot') // более точный блок для наблюдения изменений
                if (targetNode_observer) {
                    clearInterval(interval_AD_remove)
                    AD_remove_node()
                    const observer = new MutationObserver((mutationsList, observer) => {
                        for (let mutation of mutationsList) {
                            if (mutation.type === 'childList') {
                                mutation.addedNodes.forEach(node => {
                                    if (node.nodeName === 'DIV') {
                                        AD_remove_node(node, mutation)
                                    }
                                });
                            }
                        }
                    });
                    observer.observe(targetNode_observer, observer_config);
                }
            }
            const interval_AD_remove = setInterval(AD_remove, 500);
        }
        // vk.com
        else if (currentURL.startsWith('https://vk.com/')) {
            // реклама слева

            function AD_remove() {
                const targetNode_leftColumn = document.querySelector('div#ads_left')
                if (targetNode_leftColumn) {
                    clearInterval(interval_AD_remove)
                    targetNode_leftColumn.remove()
                }

            }
            const interval_AD_remove = setInterval(AD_remove, 500);


            // реклама в теле страницы
            const spans = document.querySelectorAll('span.PostHeaderSubtitle__item');
            for (let span of spans) {
                if (span.textContent === 'Реклама в сообществе') {
                    span.parentNode.parentNode.parentNode.parentNode.parentNode.remove();
                }
            }

            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // console.log('Новые узлы добавлены:', mutation.addedNodes);
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeName === 'DIV') {

                                if (node.classList.contains('page_block') &&
                                    node.classList.contains('no_posts')) {

                                    const spans = document.querySelectorAll('span.PostHeaderSubtitle__item');
                                    // if (spans.length > 0) { // на время тестирования
                                    spans.forEach(span => {
                                        if (span.textContent === 'Реклама в сообществе') {
                                            span.parentNode.parentNode.parentNode.parentNode.parentNode.remove();
                                        }
                                    });
                                    // }


                                }


                            }
                        });

                    }
                }
            });
            observer.observe(document.querySelector('div#public'), observer_config);

        }

        // ok.ru
        else if (currentURL.startsWith('https://ok.ru/')) {
            // реклама справа
            function AD_remove() {
                const targetNode_rightColumn = document.querySelector('div#rightColumn')
                if (targetNode_rightColumn) {
                    clearInterval(interval_AD_remove)
                    targetNode_rightColumn.remove()
                }
            }
            const interval_AD_remove = setInterval(AD_remove, 500);
            // реклама слева
            function AD_Left_remove() {
                const targetNode_LeftColumn = document.querySelector('div#hook_Block_StickyBannerContainer')
                if (targetNode_LeftColumn) {
                    clearInterval(interval_AD_Left_remove)
                    targetNode_LeftColumn.remove()
                }
            }
            const interval_AD_Left_remove = setInterval(AD_Left_remove, 500);
        }

    }

    // Добавлекние раскрывающегося блока "Специально для Вас..."
    function CreateEspeciallyForYou() {
        // Создание стилей с помощью JavaScript
        const style = document.createElement("style");
        style.textContent = `
                details {
                    // display: none;
                    font-family: Arial, sans-serif;
                    font-size: 18px;
                    color: #333;
                    position: relative;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    background-color: #fff;
                    max-height: 50vh;
                    overflow-y: auto;
                }
                summary {
                    cursor: pointer;
                    outline: none;
                    position: relative;
                    z-index: 1;
                    color: #df4a0f; /* Изменение цвета текста на красный */
                }
                .shimmer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0) 100%);
                    animation: shimmer 60s linear infinite;
                    pointer-events: none;
                }
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
            `;
        document.head.appendChild(style);

        // Создание элемента details
        const details = document.createElement("details");

        const summary = document.createElement("summary");
        summary.textContent = "Специальные предложения";

        const shimmer = document.createElement("div");
        shimmer.className = "shimmer";

        // const content = document.createElement("p");
        // content.textContent = "Содержимое деталей...";

        details.appendChild(summary);
        details.appendChild(shimmer);
        // details.appendChild(content);

        // document.body.appendChild(details);
        return details
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
        let targetNode
        targetNode = document.querySelector(config.nodes.mail_ru_banner_top_parent);
        if (targetNode) {
            // тип ноды меняется через каждые несколько секунд
            let targetNode_banner

            targetNode_banner = targetNode.querySelector('div.tgb-wrapper')

            if (targetNode_banner) {
                targetNode_banner.remove()
            }
        }
        const targetNodes = document.querySelectorAll('div.letter-list-item-adv')
        targetNodes.forEach(node => {
            node.remove();
        });
    }

    function mail_ru_checkAndRemoveTopBlock_classList(Node,mutation_test) {
        const classList = Array.from(Node.classList);
        if (classList.length === 3 &&
            classList.some(className => className.length === 7) &&
            classList.some(className => className.length === 7) &&
            classList.some(className => className.length >= 7 )) { // замечены варианты 15 и 17 длиной
            Node.remove();
            // Node.style.display = 'none';

        }
    }

    // внизу справа "Сделать поиск Яндекса основным?"
    function yandex_dzen_questionYandexGeneralSearch() {
        // <div class="nvBl_ nvBl_g9JqZb38zCZXEw nvBl_g9Z8ZofTxz9QBra_"><div id="dhbz" class="qb5a868df"><div class="ta805822e bacc75f5 fce2ef19d j2b3be76f o2301de0b"><div class="w6845527">
        // Выбираем все div
        const allDivs = document.querySelectorAll('div');

        // Фильтруем div, чтобы оставить только те, у которых ровно три класса
        const divsWithThreeClasses = Array.from(allDivs).filter(div => {
            const classes = div.classList;
            return classes.length === 3;
        });


        divsWithThreeClasses.forEach(div => {
            const DivChild = div.querySelector('div');
            function checkDivHasAnyId(div) {
                if (!div) {
                    // console.log('Div not found.');
                    return false;
                }

                if (!div.id) {
                    // console.log('Div does not have an id.');
                    return false;
                }

                // console.log('Div has an id.');
                // Проверяем, что div имеет ровно один класс
                if (div.classList.length !== 1) {
                    // console.log('Div does not have exactly one class.');
                    return false;
                }

                // есть вложенный div, принадлежащий пяти классам
                const DivChild2 = div.querySelector('div');
                if (!DivChild2) {
                    return false;

                }
                // Проверяем, что div принадлежит ровно 5-ти классам
                if (DivChild2.classList.length !== 5) {
                    // console.log('Div does not have exactly 5 classes.');
                    return false;
                }

                return true;
            }

            const result = checkDivHasAnyId(DivChild);
            if (result) div.remove()

        });

    }

    checkForTargetNode()


})();
