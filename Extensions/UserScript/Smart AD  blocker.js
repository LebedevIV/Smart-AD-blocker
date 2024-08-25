// ==UserScript==
// @name         Smart AD blocker for: Yandex, Mail.ru, Dzen.ru, VK, OK
// @name:ru         Умный блокировщик рекламы для: Yandex, Mail.ru, Dzen.ru, VK, OK
// @namespace    http://tampermonkey.net/
// @version      2024-08-25_15-29
// @description  Smart AD blocker with dynamic blocking protection, for: Yandex, Mail.ru, Dzen.ru, VK, OK
// @description:ru  Умный блокировщик рекламы при динамической защите от блокировки, для: Yandex, Mail.ru, Dzen.ru, VK, OK
// @author       Igor Lebedev
// @license        GPL-3.0-or-later
// @match        http://*.mail.ru/*
// @match        https://*.mail.ru/*
// @match        https://sportmail.ru/*
// @match        https://*.ya.ru/*
// @match        https://*.yandex.ru/*
// @match        https://*.ok.ru/*
// @match        https://*.vk.com/*
// @match        https://*.dzen.ru/*
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
            // ya_ru_search_suggestions: 'div.Modal.Modal_visible.Modal_hasAnimation.Distribution-SplashScreenModal.Distribution-SplashScreenModal_outerCross.SplashscreenDefault', // все возможные типы нод, используемые в качестве контекнера рекламного баннера
            ya_ru_search_suggestions: 'div.Modal.Modal_visible.Modal_hasAnimation', // классы, используемые в качестве контекнера рекламного баннера


        }
    };
    let intervalId
    const observer_config = { childList: true, subtree: true } // общи конфиг обсервера
    // Массив для хранения ссылок на обсерверы
    const observers = []
    // счётчики
    let count_001 = 0, count_002 = 0

    // Функция для обработки изменений URL
    function handleUrlChange() {
        // console.log('URL changed to:', window.location.href);
        if (currentURL.startsWith('https://e.mail.ru/')) {
            // удаление верхнего рекламного блока
            let fact_Remove_AD_Top_3column = false // факт удаления верхнего рекламного блока в интерфейсе с тремя столбцами где содержимое письма в 3-м столбце
            function Remove_AD_Top(node) {
                // count_001++
                // console.log('Счётчик вызовов:', count_001)
                // let Div_AD
                if (!node) { // первый запуск
                    document.querySelector("div.new-menu")?.previousSibling?.remove()
                }
                else { // запуск из обсервера
                    if (node.nodeName === 'DIV') { // application app application_new-toolbar
                        // const Div_AD_classList = Array.from(Div_AD.classList)
                        // первое открытие страницы
                        if (node.classList.length === 3 &&
                            node.classList[0] === 'application' &&
                            node.classList[1] === 'app' &&
                            node.classList[2] === 'application_new-toolbar' )
                        {
                            // count_001++
                            // console.log('Счётчик вызовов:', count_001)
                            // console.log('Remove_AD_Top:', node)
                            // запуск из обсервера: приходится заново искать объект, так как он уже не равен добавляемой ноде
                            node.querySelector("div.new-menu")?.previousSibling?.remove()
                        }
                        // изменение адреса страницы при навигации - привязка к любому изменяемому элементу
                        else if (node.classList[0] === 'portal-menu-element' &&
                                 node.classList[1] === 'portal-menu-element_select')
                        {
                            document.querySelector("div.new-menu")?.previousSibling?.remove()
                        }
                    }
                }

                // В интерфейсе с тремя столбцами где содержимое письма в 3-м столбце
                if (!fact_Remove_AD_Top_3column) { // ранее не удалялось
                    // Найти div с классом ReactVirtualized__Grid__innerScrollContainer
                    const container = document.querySelector('div.ReactVirtualized__Grid__innerScrollContainer')
                    if (container) {
                        // Найти первый дочерний div, у которого нет других дочерних элементов и перед которым нет элементов <a>
                        let targetDiv = null
                        for (let child of container.children) {
                            if (child.tagName === 'DIV' && child.childElementCount === 0) {
                                let previousSibling = child.previousElementSibling
                                let hasAnchorBefore = false;
                                while (previousSibling) {
                                    if (previousSibling.tagName === 'A') {
                                        hasAnchorBefore = true
                                        break
                                    }
                                    previousSibling = previousSibling.previousElementSibling
                                }
                                if (!hasAnchorBefore) {
                                    targetDiv = child
                                    break
                                }
                            }
                        }

                        if (targetDiv) {
                            // Удалить найденный div и все предшествующие ему внутри контейнера
                            let currentChild = targetDiv
                            while (currentChild) {
                                fact_Remove_AD_Top_3column = true
                                let previousSibling = currentChild.previousElementSibling
                                if (previousSibling) {
                                    container.removeChild(previousSibling)
                                } else {
                                    container.removeChild(currentChild)
                                    break
                                }
                            }
                        }
                    }
                }


            }
            // удаление правых рекламных блоков
            function Remove_AD_Right(node) {
                // блок опрделяется непосредственно перед анализом так как иначе теряется
                function Remove_AD_Right_IfNode(targetNode){
                    const span = targetNode?.querySelector('span')
                    if (span) {
                        const RightBlock = span.querySelector('div.layout__column.layout__column_right.layout__column_right-indented') // классы элемента до переименования
                        if (RightBlock) {
                            // console.log('Remove_AD_Right_1:', RightBlock)
                            RightBlock?.remove()
                        }
                        else { // классы элемента после переименования
                            // Получаем непосредственные дочерние элементы
                            const divs = span.children;

                            // Перебираем дочерние элементы
                            if (divs.length === 3) {
                                for (let div of divs) {
                                    // const classList = Array.from(div.classList);
                                    if (div.classList.length === 3 &&
                                        div.classList[0].length === 7 &&
                                        div.classList[1].length === 15 &&
                                        div.classList[2].length === 15)
                                    {
                                        // console.log('Remove_AD_Right_2:', div)
                                        div?.remove()
                                        break
                                    }
                                }
                            }
                        }
                    }
                }
                if (!node) { // первый запуск
                    const targetNode = document.querySelector(config.nodes.mail_ru_email_GeneralBlock) // 'div.application-mail__layout.application-mail__layout_main'
                    Remove_AD_Right_IfNode(targetNode)
                }
                else { // запуск из обсервера
                    if (node.nodeName === 'DIV') { // application app application_new-toolbar
                        // const Div_AD_classList = Array.from(Div_AD.classList)
                        if (node.classList.length === 3 &&
                            node.classList[0] === 'application' &&
                            node.classList[1] === 'app' &&
                            node.classList[2] === 'application_new-toolbar' )
                        {
                            // count_002++
                            // console.log('Счётчик вызовов:', count_002)
                            // console.log('Remove_AD_Right:', node)
                            // запуск из обсервера: приходится заново искать объект, так как он уже не равен добавляемой ноде
                            // node.querySelector("div.new-menu")?.previousSibling?.remove()
                            const targetNode = node.querySelector(config.nodes.mail_ru_email_GeneralBlock) // 'div.application-mail__layout.application-mail__layout_main'
                            Remove_AD_Right_IfNode(targetNode)
                        }
                    }
                }
            }
            // установка наблюдения за изменением блока-родителя
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            Remove_AD_Top(node)
                            Remove_AD_Right(node)
                        })
                    }
                }
            })
            observer.observe(document, observer_config) // удаление при изменении блока-родителя
            observers.push(observer)
            // удаление при загрузке
            Remove_AD_Top()
            Remove_AD_Right()



            function checkFor_GeneralBlock() {
                const targetNode = document.querySelector(config.nodes.mail_ru_email_GeneralBlock) // 'div.application-mail__layout.application-mail__layout_main

                if (targetNode) {
                    clearInterval(interval_GeneralBlock)
                    checkAndRemoveMailruSuggestions(null)
                    mail_ru_checkAndRemoveTopBlock()

                    // Настраиваем наблюдение за изменениями в документе
                    const observer = new MutationObserver((mutationsList, observer) => {
                        for (let mutation of mutationsList) {
                            if (mutation.type === 'childList') {

                                mutation.removedNodes.forEach(node => {
                                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('div.portal-menu-element.portal-menu-element_select.portal-menu-element_expanded.portal-menu-element_not-touch.portal-menu-element_pony-mode')) {

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
                    observers.push(observer)
                }
            }
            // Функция для проверки наличия и удаления блока рекламного банера Майлру в нижнем левом углу
            function checkAndRemoveMailruSuggestions(mutation) {
                const targetNode = document.querySelector(config.nodes.mail_ru_suggestions)
                if (targetNode) {
                    // clearInterval(interval_MailruSuggestions); // Останавливаем интервал, так как элемент уже найден
                    targetNode.remove()
                }
            }
            const interval_GeneralBlock = setInterval(checkFor_GeneralBlock, 200)

            }
        // почта на мобильном устройстве
        else if (currentURL.startsWith('https://touch.mail.ru/messages/')) {
            // верхний узкий баннер
            document.querySelector('div.mailru-visibility-check')?.parentNode?.remove()
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeName === 'DIV') {
                                document.querySelector('div.mailru-visibility-check')?.parentNode?.remove()
                            }
                        })
                    }
                }
            });
            observer.observe(document.body, observer_config)
            observers.push(observer)
        }
        else if (currentURL.startsWith('https://cloud.mail.ru/attaches/')) {
            // нижний узкий баннер
            document.querySelector('div[class^="ReactViewer__attachesinfo"]')?.remove()
            // правая панель
            document.querySelector('div[class^="ReactViewer__attachesSidebar"]')?.remove()
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeName === 'DIV') {
                                // нижний узкий баннер
                                document.querySelector('div[class^="ReactViewer__attachesinfo"]')?.remove()
                                // правая панель
                                document.querySelector('div[class^="ReactViewer__attachesSidebar"]')?.remove()
                            }
                        });
                    }
                }
            });
            observer.observe(document.body, observer_config)
            observers.push(observer)
        }
        else if (currentURL.startsWith('https://cloud.mail.ru/home/') || currentURL.startsWith('https://doc.mail.ru/')) {
            // верхний узкий баннер
            document.querySelector('div[class^="Worm__root--"]')?.remove()
        }
        else if (currentURL.startsWith('https://news.mail.ru/') ||
                 currentURL.startsWith('https://vfokuse.mail.ru/') ||
                 currentURL.startsWith('https://sportmail.ru/') ||
                 currentURL.startsWith('https://finance.mail.ru/')
                ) {
            // нижний узкий баннер
            function AD_remove_node(node_test, mutation_test) {
                if (currentURL.startsWith('https://finance.mail.ru/')) {
                    // поиск блока с рекламой, занимающего верхнее пространство страницы
                    function findParentWithProperties(targetNode) {
                        function checkParent(node, level) {
                            if (level > 4) {
                                return null;
                            }

                            const parent = node.parentElement;
                            if (!parent) {
                                return null;
                            }

                            const style = parent.style.minHeight;
                            const dataHideOrder = parent.getAttribute('data-hideorder');
                            const dataSize = parent.getAttribute('data-size');

                            if (style && dataHideOrder !== null && dataSize !== null) {
                                return parent;
                            }

                            return checkParent(parent, level + 1);
                        }

                        return checkParent(targetNode, 1);
                    }

                    const targetNode = document.querySelector('div.mailru-visibility-check')
                    if (targetNode) {
                        const parentWithProperties = findParentWithProperties(targetNode);

                        if (parentWithProperties) {
                            parentWithProperties.remove()
                        } else {
                            targetNode.remove()
                        }
                    }
                }
                else {
                    document.querySelector('div.mailru-visibility-check')?.remove()
                }
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
            observer.observe(document.body, observer_config)
            observers.push(observer)
            AD_remove_node()
        }
        else if (currentURL.startsWith('https://mail.ru/')) {
            mail_ru_checkAndRemoveTopBlock()
            // mail_ru_checkAndRemove_РекламаInSpan()

            //             // Удаление всех нод, содержащих shaodw-root (именно там запрятана реклама)
            //             const observer_shadow = new MutationObserver((mutations) => {
            //                 mutations.forEach((mutation) => {
            //                     // Check if the mutation is a node addition (addedNodes)
            //                     if (mutation.type === 'childList') {
            //                         mutation.addedNodes.forEach((node) => {
            //                             // Check if the added node has a shadow root
            //                             if (node.shadowRoot) {
            //                                 // console.log('Element with shadow root added:', node);
            //                                 node.remove()
            //                             }
            //                         });
            //                     }
            //                 });
            //             });

            //             // Start observing the entire document for changes
            //             observer_shadow.observe(document.body, {
            //                 subtree: true, // Observe changes in the entire document subtree
            //                 childList: true, // Observe changes in child nodes (additions and removals)
            //             });

            //             //**********************
            //             // Удаление рекламы, появляющейся на экране по мере прокрутки страницы
            //             // Функция для проверки, содержит ли элемент заданный класс
            //             function hasClass(element, className) {
            //                 return element.classList.contains(className);
            //             }

            //             // Создаем экземпляр MutationObserver для отслеживания изменений в DOM
            //             const mutationObserver = new MutationObserver((mutationsList, observer) => {
            //                 for (const mutation of mutationsList) {
            //                     if (mutation.type === 'childList') {
            //                         mutation.addedNodes.forEach(node => {
            //                             if (node.nodeType === Node.ELEMENT_NODE) {
            //                                 const element = node;
            //                                 // if (hasClass(element, 'zenad-card-rtb__ad')) {
            //                                 if (hasClass(element, 'zenad-card-rtb')) {

            //                                     // console.log('Элемент с классом "your-class-name" добавлен в DOM:', element);
            //                                     // Начинаем отслеживать видимость элемента с помощью IntersectionObserver
            //                                     intersectionObserver.observe(element);
            //                                 }
            //                             }
            //                         });
            //                     }
            //                 }
            //             });

            //             // Настройка наблюдения за изменениями в корневом элементе
            //             const targetNode = document.body; // Можно заменить на другой элемент
            //             const config_Observer = { childList: true, subtree: true };
            //             mutationObserver.observe(targetNode, config_Observer);

            //             // Создаем экземпляр IntersectionObserver для отслеживания видимости элементов
            //             const intersectionObserver = new IntersectionObserver((entries, observer) => {
            //                 entries.forEach(entry => {
            //                     if (entry.isIntersecting) {
            //                         // console.log('Элемент с классом "your-class-name" появился на экране:', entry.target);
            //                         // Здесь можно выполнить дополнительные действия, когда элемент становится видимым
            //                         observer.unobserve(entry.target); // Перестаем отслеживать этот элемент после того, как он появился на экране
            //                         entry.remove()
            //                     }
            //                 });
            //             });
            //             //*********************

            // function AD_remove() {
            //     if (document.querySelector(config.nodes.mail_ru_banner_top_parent)) {
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // console.log('Новые узлы добавлены:', mutation.addedNodes);
                        // для всех возможных типов нод-контейнеров баннера
                        config.nodes.mail_ru_banner_top_parent_bannerClassList.forEach(item => {
                            // mail_ru_checkAndRemoveTopBlock()
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeName === item.toUpperCase()) {
                                    // mail_ru_checkAndRemoveTopBlock_classList(node,mutation)
                                }
                                // mail_ru_checkAndRemove_РекламаВShadow()
                                // mail_ru_checkAndRemove_РекламаInSpan(node, mutation)

                            });
                        });
                        // document.querySelectorAll('article.zenad-card-rtb').forEach(node => {
                        //                         document.querySelectorAll('article.zenad-card-rtb[data-testid="card-rtb"]').forEach(node => {
                        document.querySelectorAll('article.zenad-card-rtb[aria-label="Карточка рекламы"]').forEach((node, index, array) => {
                            // if (index > 0 && index < array.length - 1 ) {
                            // node?.remove()
                            node.style.display = 'none'
                            // }
                            // Если удалить сразу все ноды - возникают глюки. Удаляем первые ноды, оставляя последующие невидимыми
                            if (array.length > 10 && index < 5) {
                                node?.remove()
                            }
                        })
                    }
                }
            });
            observer.observe(document.querySelector(config.nodes.mail_ru_banner_top_parent), observer_config)
            observers.push(observer)
            // }
            // }
            // const interval_AD_remove = setInterval(AD_remove, 500)

        }
        else if (currentURL.startsWith('https://ya.ru/search') || currentURL.startsWith('https://yandex.ru/search')) {
            function AD_remove_node(node, mutation_test) {
                // баннер внизу справа "Сделать Яндекс основным поисковиком?"
                let targetNode
                targetNode = document.querySelector(config.nodes.ya_ru_search_suggestions) // 'div.Modal.Modal_visible.Modal_hasAnimation.Distribution-SplashScreenModal.Distribution-SplashScreenModal_outerCross.SplashscreenDefault'
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
            observer.observe(document.body, observer_config)
            observers.push(observer)
            AD_remove_node()


        }
        // настроить обсервер
        else if (currentURL.startsWith('https://ya.ru/images/') || currentURL.startsWith('https://yandex.ru/images/')) {
            // Добавление кнопки "Реклама"
            // const EspeciallyForYou = CreateEspeciallyForYou()
            // let EspeciallyForYou_fact = false
            const AdvDetails = {
                Details: CreateEspeciallyForYou(),
                Details_fact: false,
                countBanners: 0,
            }
            let ADRight_fact = false // факт вывода рекоамного блока справа внутри "Реклама"

            // блок справа
            function AD_remove_node(node, mutation_test) {
                let targetNode
                let targetNodes

                // баннер "Сделать поиск Яндекса основным?"
                targetNode = document.querySelector(config.nodes.ya_ru_search_suggestions) || document.querySelector('div#distr-pcode-container') // 'div.Modal.Modal_visible.Modal_hasAnimation.Distribution-SplashScreenModal.Distribution-SplashScreenModal_outerCross.SplashscreenDefault'
                // Modal Modal_visible Modal_hasAnimation Distribution-SplashScreenModal SplashscreenTopButton SplashscreenTopButton_layout_system_top_dark_close-button
                if (targetNode) {
                    // if (EspeciallyForYou_fact === false) {
                    if (AdvDetails.Details_fact === false) {
                        targetNode.style.marginTop = '0.3rem'
                        // EspeciallyForYou?.appendChild(targetNode)
                        AdvDetails.Details.appendChild(targetNode)
                        AdvDetails.countBanners++
                    }
                    else {
                        targetNode?.remove()
                    }
                }
                // баннер справа
                targetNode = document.querySelector('div.ImagesViewer-SidebarAdv')
                targetNode?.parentNode.remove()
                targetNode = document.querySelector('div#ImagesViewer-SidebarAdv')
                targetNode?.parentNode.parentNode.parentNode.remove()
                // баннер вверху
                targetNode = document.querySelector('div.AdvMastHead')
                targetNode?.remove()
                // реклама среди картинок
                document.querySelectorAll('div.JustifierRowLayout-Incut').forEach(node => {node?.remove()})
                document.querySelectorAll('div.AdvRsyaCrossPage').forEach(node => {node?.remove()})
                document.querySelectorAll('div[aria-label="Рекламный баннер"]').forEach(node => {node?.remove()})
                // if (node) observer.disconnect()
                // при нажатии на какую-либо картинку открывается модальное окно
                const targetNodeModal = document.querySelector('div.Modal.Modal_visible.Modal_theme_normal.ImagesViewer-Modal.ImagesViewer')
                if (targetNodeModal) {
                    // в модальном окне удаление рекламы справа
                    targetNodes = targetNodeModal.querySelectorAll('div[id^="ImagesViewer-"]')
                    targetNodes.forEach(node => {
                        // Поиск главного родительского блока, содержащего рекламу
                        const node_parentNode = findParentWithClassEndingInCard(node)
                        if (!ADRight_fact) {
                            node.style.marginTop = '0.3rem'
                            // EspeciallyForYou?.appendChild(node)
                            AdvDetails.Details.appendChild(node)
                            AdvDetails.countBanners++
                            ADRight_fact = true
                        }
                        node_parentNode?.remove()

                    });

                    // добавление "Реклама" под блок-ссылку на источник изображения
                    if (AdvDetails.countBanners > 0) {
                        // if (EspeciallyForYou_fact === false) {
                        if (AdvDetails.Details_fact === false) {

                            const div_imageSource = targetNodeModal.querySelector('div.ImagesViewer-LayoutSideblock')
                            if (div_imageSource) {
                                // EspeciallyForYou.querySelector('summary').textContent += ' (' + AdvDetails.countBanners + ')'
                                // div_imageSource.appendChild(EspeciallyForYou)
                                // AdvDetails.Details.querySelector('summary').textContent = messageSpecialOffer('Реклама') + ' (' + AdvDetails.countBanners + ')'
                                AdvDetails.Details.querySelector('summary').textContent = messageSpecialOffer('Реклама') + ` (${AdvDetails.countBanners})`
                                div_imageSource.appendChild(AdvDetails.Details)
                                // EspeciallyForYou_fact = true
                                AdvDetails.Details_fact = true

                            }
                        }
                    }

                    // Поиск главного родительского блока, содержащего рекламу
                    function findParentWithClassEndingInCard(node) {
                        let currentNode = node

                        // Проверяем каждого родителя, пока не найдем нужный элемент или не дойдем до корня документа
                        while (currentNode && currentNode !== document.body) {
                            // Проверяем, есть ли у текущего элемента класс, оканчивающийся на "-Card"
                            if (currentNode.classList && Array.from(currentNode.classList).some(className => className.endsWith('-Card'))) {
                                return currentNode;
                            }
                            // Переходим к следующему родителю
                            currentNode = currentNode.parentNode
                        }

                        // Если нужный элемент не найден, возвращаем null
                        return null;
                    }
                }
                // else {
                //     // сброс флага вывода блока "Реклама" при закрытии модального окна
                //     EspeciallyForYou_fact = false
                // }
            }
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            // if (node.nodeName === 'DIV') {
                            if (node.className !== 'details_EspeciallyForYou') {
                                AD_remove_node(node, mutation)
                            }

                        });
                        mutation.removedNodes.forEach(node => {
                            if (node.nodeName === 'DIV') {
                                const targetNodeModal = document.querySelector('div.Modal.Modal_visible.Modal_theme_normal.ImagesViewer-Modal.ImagesViewer')
                                // модальное окно изображения было закрыто или ещё не открылось
                                if (!targetNodeModal) {
                                    // EspeciallyForYou_fact = false
                                    AdvDetails.Details_fact = false

                                    ADRight_fact = false
                                    // Очистка <details>
                                    // Выбираем все дочерние элементы <details>, кроме <summary>
                                    // const childNodes = EspeciallyForYou.querySelectorAll('details > *:not(summary)')
                                    const childNodes = AdvDetails.Details.querySelectorAll('details > *:not(summary)')

                                    // Удаляем каждый из выбранных элементов
                                    childNodes.forEach(node => {
                                        // EspeciallyForYou.removeChild(node)
                                        AdvDetails.Details.removeChild(node)
                                    });
                                    // AdvDetails.countBanners = 0
                                    AdvDetails.Details.querySelector('summary').textContent = messageSpecialOffer('Реклама')
                                }
                            }
                        });
                    }
                }
            });
            observer.observe(document.body, observer_config)
            observers.push(observer)
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
            observer.observe(document.body, observer_config)
            observers.push(observer)
            AD_remove_node()
            yandex_dzen_questionYandexGeneralSearch()

        }
        else if (currentURL.startsWith('https://ya.ru/')) {
            // если это мбильное устройство
            if (isMobileDevice()) {
                document.querySelector('div.dialog__wrapper')?.remove()
            }
            else {
                // Добавление кнопки "Реклама"
                // const EspeciallyForYou = CreateEspeciallyForYou()
                const AdvDetails = {
                    Details: CreateEspeciallyForYou(),
                    Details_fact: false,
                    countBanners: 0,
                }
                // const EspeciallyForYou_Content = EspeciallyForYou.querySelector('div.shimmer')
                // simple-popup dist-overlay__popup simple-popup_direction_center simple-popup_theme_modal simple-popup_autoclosable_yes simple-popup_overlay_yes simple-popup_has-close_yes simple-popup_delay-close_yes simple-popup_overlay-color_default simple-popup_shown_true simple-popup_delay-close-shown_yes
                // simple-popup__content

                // Удаление без наблюдения
                // перенос всей рекламы в специальный фрейм "Специально для Вас..."
                // const headline__personal = document.querySelector('div.headline__personal')
                let targetNode
                // курсы валют и нефти (сделать опциональным)
                targetNode = document.querySelector('section.informers3__stocks')
                // targetNode?.remove()
                if (targetNode) {
                    targetNode.style.marginTop = '0.3rem'
                    // EspeciallyForYou?.appendChild(targetNode)
                    AdvDetails.Details.appendChild(targetNode)
                    AdvDetails.countBanners++
                }

                targetNode = document.querySelector(config.nodes.ya_ru_banner_under_search)
                // targetNode?.remove()
                if (targetNode) {
                    AdvDetails.Details?.appendChild(targetNode)
                    AdvDetails.countBanners++
                }

                // модальное окно посредине в начале "Сделайте Яндекс главной страницей"
                targetNode = document.querySelector('div.simple-popup') ||
                    document.querySelector('div.dist-overlay__popup') ||
                    document.querySelector('div.simple-popup_direction_center') ||
                    document.querySelector('div.simple-popup_theme_modal') ||
                    document.querySelector('div.simple-popup_autoclosable_yes') ||
                    document.querySelector('div.simple-popup_overlay_yes') ||
                    document.querySelector('div.simple-popup_has-close_yes') ||
                    document.querySelector('div.simple-popup_delay-close_yes') ||
                    document.querySelector('div.simple-popup_overlay-color_default') ||
                    document.querySelector('div.simple-popup_shown_true') ||
                    document.querySelector('div.simple-popup_delay-close-shown_yes')
                if (targetNode) {
                    targetNode.style.marginTop = '0.3rem'
                    AdvDetails.Details.appendChild(targetNode)
                    AdvDetails.countBanners++
                }


                const dist_stripe = document.querySelector("div.dist-stripe")
                // dist_stripe?.parentNode.remove()
                if (targetNode) {
                    AdvDetails.Details.appendChild(targetNode)
                    AdvDetails.countBanners++
                }

                const mainElement = document.querySelector('main.body__wrapper');
                if (mainElement) {
                    const targetNode = mainElement.querySelector('div[data-hydration-id] > div.dist-stripe');
                    if (targetNode) {
                        AdvDetails.Details.appendChild(targetNode.parentNode)
                        AdvDetails.countBanners++
                    }
                }

                // Добавление EspeciallyForYou под блок поля поиска
                if (AdvDetails.countBanners > 0) {
                    const ForEspeciallyForYou_Container = document.querySelector('div.body__content')
                    if (ForEspeciallyForYou_Container && AdvDetails.Details.parentNode !== ForEspeciallyForYou_Container) {
                        AdvDetails.Details.querySelector('summary').textContent = messageSpecialOffer('Реклама') + ' (' + AdvDetails.countBanners + ')'
                        ForEspeciallyForYou_Container.appendChild(AdvDetails.Details)
                    }
                }
                // Удаление с наблюдением
                function AD_remove_node(node, mutation_test) {
                    // Кнопка "Установить Яндекс.браузер"
                    let targetNode = document.querySelector('div.link-bro')
                    if (targetNode && targetNode.parentNode !== AdvDetails.Details) {
                        if (AdvDetails.Details.querySelector('div.link-bro')) {
                            targetNode?.remove()
                            // AdvDetails.countBanners--
                        }
                        else {
                            targetNode.style.position = 'unset'
                            targetNode.style.marginTop = '0.3rem'
                            const targetNodeA = targetNode.querySelector('a')
                            if (targetNodeA) targetNodeA.style.marginBottom = 0
                            AdvDetails.Details.appendChild(targetNode)
                            AdvDetails.countBanners++
                            AdvDetails.Details.querySelector('summary').textContent = messageSpecialOffer('Реклама') + ' (' + AdvDetails.countBanners + ')'
                        }
                    }

                    // модальное окно посредине в начале "Сделайте Яндекс главной страницей"
                    targetNode = document.querySelector('div.simple-popup') ||
                        document.querySelector('div.dist-overlay__popup') ||
                        document.querySelector('div.simple-popup_direction_center') ||
                        document.querySelector('div.simple-popup_theme_modal') ||
                        document.querySelector('div.simple-popup_autoclosable_yes') ||
                        document.querySelector('div.simple-popup_overlay_yes') ||
                        document.querySelector('div.simple-popup_has-close_yes') ||
                        document.querySelector('div.simple-popup_delay-close_yes') ||
                        document.querySelector('div.simple-popup_overlay-color_default') ||
                        document.querySelector('div.simple-popup_shown_true') ||
                        document.querySelector('div.simple-popup_delay-close-shown_yes')
                    if (targetNode) {
                        targetNode.style.marginTop = '0.3rem'
                        AdvDetails.Details.appendChild(targetNode)
                        AdvDetails.countBanners++
                        AdvDetails.Details.querySelector('summary').textContent = messageSpecialOffer('Реклама') + ' (' + AdvDetails.countBanners + ')'
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
                        observers.push(observer)
                    }
                }
                const interval_AD_remove = setInterval(AD_remove, 500)

                }
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
            observer.observe(document.querySelector('div.page__right'), observer_config)
            observers.push(observer)
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
                    observer.observe(targetNode, observer_config)
                    observers.push(observer)

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
                    observer.observe(targetNode, observer_config)
                    observers.push(observer)
                }
            }
            const interval_AD_remove = setInterval(AD_remove, 500);
        }
        // https://yandex.ru/health
        // брать за образец в случае рекламы внутри наблюдаемой ноды
        else if (currentURL.startsWith('https://yandex.ru/health')) {

            function AD_remove_node(node, mutation_test) {
                let targetNode
                let targetNodes

                // баннер сверху
                // реклама по всем направлениям
                targetNodes = document.querySelectorAll('div.advert_type_horizontal')
                targetNodes.forEach(node => {
                    node.remove()
                })
                targetNodes = document.querySelectorAll('span.advert_type_horizontal')
                targetNodes.forEach(node => {
                    node.remove()
                })

                // правый стобец
                targetNode = document.querySelector('div.row__col.layout__right')
                targetNode?.remove()

            }
            // Удаление с наблюдением
            function AD_remove() {
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
                observer.observe(document.body, observer_config)
                observers.push(observer)
            }
            AD_remove()
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
            observer.observe(document.body, observer_config)
            observers.push(observer)

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
                // верхний баннер
                targetNode_observer.querySelector('div#top-banner')?.remove()
                const targetNodes = targetNode_observer.querySelectorAll('aside:not(.navigation-sidebar__container-TO)') ||
                      targetNode_observer.querySelectorAll('ya-recommendation-widget')
                targetNodes.forEach(node => {
                    node?.remove()
                })
                // рекламные блоки справа
                // 'div.article-right-ad-block__sticky' 'div.article-right-ad-block__main' 'div.article-right-ad-block__ad-content-wrapper'
                targetNode_observer.querySelectorAll('div[class^="article-right-ad-block__"]').forEach(node => {
                    node?.remove()
                })
                // рекламные блоки снизу статьи
                if (node) {
                    targetNode_observer.querySelectorAll('div[class^="ad-split-embed"][id]').forEach(node => {
                        // ad-split-embed__container
                        node?.remove()
                    })
                }
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
                    observer.observe(targetNode_observer, observer_config)
                    observers.push(observer)
                }
            }
            const interval_AD_remove = setInterval(AD_remove, 500)

            }
        // Дзен.Видео
        // брать за образец в случае рекламы внутри наблюдаемой ноды
        else if (currentURL.startsWith('https://dzen.ru/video/')) {
            function AD_remove_node(node, mutation_test) {
                // document.querySelectorAll('div[class^="video-card-ad"]').forEach(node => {
                document.querySelectorAll('div.video-card-ads').forEach(node => {
                    node?.remove()
                })
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
            observer.observe(document.body, observer_config)
            observers.push(observer)
            AD_remove_node()

            // Удаление видеорекламы
            if (currentURL.startsWith('https://dzen.ru/video/watch/')) {
                function ADvideo_remove() {
                    // Находим ноду <yaplayertag>
                    const yaplayertag = document.querySelector('yaplayertag')
                    if (yaplayertag) {
                        // Проверяем непосредственные потомки yaplayertag
                        const children = yaplayertag.children
                        if (children.length > 2) { // дочерние элементы заполняются на странице не сразу - ждём заполнения
                            clearInterval(interval_ADvideo_remove)
                            // Создаем массив для хранения div, которые нужно удалить
                            const divsToRemove = [];

                            for (let i = 0; i < children.length; i++) {
                                const child = children[i];
                                if (child.tagName === 'DIV' && !child.querySelector('video')) {
                                    divsToRemove.push(child);
                                }
                            }

                            // Удаляем все найденные div
                            divsToRemove.forEach(div => yaplayertag.removeChild(div))
                        }
                    }
                }
                const interval_ADvideo_remove = setInterval(ADvideo_remove, 500)
                }
        }
        // Дзен.Shorts
        // брать за образец в случае рекламы внутри наблюдаемой ноды
        else if (currentURL.startsWith('https://dzen.ru/shorts/')) {
            function AD_remove_node(node, mutation_test) {
                // банерок вверху справа
                // возможно, для более точноо поиска: auto-slide-ad__ ; более общий правый блок: short-viewer-layout__
                if (!node) { // первый вызов без обсервера
                    // document.querySelectorAll('div[class^="short-viewer-layout__rightSidebarWrapper"]').forEach(node => {
                    //     node?.remove()
                    // })
                    // возникает в единственном экземпляре
                    document.querySelector('div[class^="short-viewer-layout__rightSidebarWrapper"]')?.remove()
                }
                else { // вызов из обсервера
                    if (node.tagName === 'DIV') {
                        const classList = node.classList;
                        // for (let i = 0; i < classList.length; i++) {
                        //     if (classList[i].startsWith('short-viewer-layout__rightSidebarWrapper')) {
                        //         node?.remove()
                        //         break
                        //     }
                        // }
                        if (classList.contains('auto-slide-ad__container-1D')) {
                            node?.remove()
                            return true
                        }
                    }
                }
                // предложение скачат приложение по QR-коду
                document.querySelector('div.Modal')?.remove()

                return false
            }
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeName === 'DIV') {
                                // при срабатывании удаления рекламы отключаетяс наблюдение, так как реклама бльше не появляется
                                // не отключаем наблюдение, так как появляются разные предлагалки. Красивые предлагалки по теме конкретного видео справа от видео не удаляю - такой и должна быть умная реклама
                                // if (AD_remove_node(node, mutation)) observer.disconnect()
                                AD_remove_node(node, mutation)
                            }
                        });
                    }
                }
            });
            observer.observe(document.body, observer_config)
            observers.push(observer)
            AD_remove_node()
        }







        // Дзен: общее
        // брать за образец в случае хаотичной рекламы
        else if (currentURL.startsWith('https://dzen.ru/') || currentURL.startsWith('https://m.dzen.ru/')) {
            if (isMobileDevice()) {
                // верхний баннер
                document.querySelectorAll('div[class*="dzen-mobile--dzen-mobile__hasBanner"]').forEach(node => {node?.remove()})
                // const observer = new MutationObserver((mutationsList, observer) => {
                //     for (let mutation of mutationsList) {
                //         if (mutation.type === 'childList') {
                //             mutation.addedNodes.forEach(node => {
                //                 if (node.nodeName === 'DIV') {
                //                     document.querySelectorAll('div[class*="dzen-mobile--dzen-mobile__hasBanner"]').forEach(node => {node?.remove()})
                //                 }
                //             })
                //         }
                //     }
                // })
                // observer.observe(document.body, observer_config)
                // observers.push(observer)
            }
            else {
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

                    // Кнопка "Установить Яндекс.браузер" под поиском
                    // targetNode = document.querySelector('div#ya-dist-link_bro')
                    // if (targetNode && targetNode.parentNode !== EspeciallyForYou) {
                    //     if (EspeciallyForYou.querySelector('div#ya-dist-link_bro')) {
                    //         // targetNode?.remove()
                    //     }
                    //     else {
                    //         targetNode.style.position = 'unset'
                    //         targetNode.style.marginTop = '0.3rem'
                    //         const targetNodeA = targetNode.querySelector('a')
                    //         if (targetNodeA) targetNodeA.style.marginBottom = 0
                    //         EspeciallyForYou?.appendChild(targetNode)
                    //     }
                    // }

                    // Кнопка "Установить Яндекс.браузер" внизу справа
                    targetNode = document.querySelector('div#ya-dist-teaser')
                    if (targetNode) targetNode?.remove()
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
                        // if (node.parentNode !== EspeciallyForYou) {
                        //     node.style.marginTop = '0.3rem'
                        //     EspeciallyForYou?.appendChild(node)
                        // }
                        // удаление так как слишком много этой рекламы
                        node.remove()
                    })
                    // Модальное окно "Яндекс станет основным поиском"
                    document.querySelector('div#ya-dist-splashscreen')?.remove()
                    // Слева вверху "Сделать поиск Яндекса основным?"
                    document.querySelector('div#ya-dist-popup')?.remove()
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
                        observer.observe(targetNode_observer, observer_config)
                        observers.push(observer)
                    }
                }
                const interval_AD_remove = setInterval(AD_remove, 500)

                }
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
            observer.observe(document.querySelector('div#public'), observer_config)
            observers.push(observer)
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

    // Добавлекние раскрывающегося блока "Реклама"
    function CreateEspeciallyForYou() {
        // Создание стилей с помощью JavaScript
        const style = document.createElement("style")
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
        // Добавляем класс my-details-class к элементу <details>
        details.classList.add('details_EspeciallyForYou');

        const summary = document.createElement("summary");
        summary.textContent = messageSpecialOffer('Реклама')

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

    // Возврат строк в зависимости от языка
    function messageSpecialOffer(idMsg) {
        // Определение языка браузера
        const browserLanguage = navigator.language || navigator.userLanguage
        let messageSpecialOffer

        switch (idMsg) {
            case "Реклама":
                messageSpecialOffer = 'Реклама'
                switch (browserLanguage) {
                    case "uken":
                        messageSpecialOffer = 'Реклама'
                        break;
                    default:
                        messageSpecialOffer = 'Реклама'
                }
                return messageSpecialOffer
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


        // Поиск элемент с текстом "Реклама" внутри всех #shadow-root и определение блоков до #shadow-root

        // Функция для поиска элемента по текстовому содержимому внутри shadow DOM
        function findElementByTextInShadow(shadowRoot, tag, text) {
            const elements = shadowRoot.querySelectorAll(tag);
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].textContent === text) {
                    return elements[i];
                }
            }
            return null;
        }

        //         // Найти все shadow host'ы на странице
        //         const shadowHosts = document.querySelectorAll('*');

        //         shadowHosts.forEach(shadowHost => {
        //             const shadowRoot = shadowHost.shadowRoot;

        //             if (shadowRoot) {
        //                 // Найти элемент с текстом "Реклама" внутри shadow root
        //                 const рекламаElement = findElementByTextInShadow(shadowRoot, 'span', 'Реклама');

        //                 if (рекламаElement) {
        //                     // Подняться по родительским нодам вплоть до shadow-root
        //                     let currentNode = рекламаElement;
        //                     while (currentNode && currentNode.parentNode !== shadowRoot) {
        //                         currentNode = currentNode.parentNode;
        //                     }

        //                     // Теперь currentNode указывает на элемент, непосредственно следующий за shadow-root
        //                     console.log(currentNode);
        //                 } else {
        //                     console.log('Элемент с текстом "Реклама" не найден внутри shadow root');
        //                 }
        //             } else {
        //                 console.log('Shadow root не найден');
        //             }
        //         });

    }
    function mail_ru_checkAndRemove_РекламаInSpan(node_test, mutation_test) {
        if (node_test && node_test.nodeName === 'DIV') {
            const DivBlockclassList = Array.from(node_test.classList);
            if (DivBlockclassList.some(className => className === 'mailru-dzen-themes') //||
                // DivBlockclassList.some(className => className === 'feed__row') &&
                // DivBlockclassList.some(className => className === '_is-mailru-morda')
               ) {
                // document.querySelectorAll('article.card-wrapper').forEach(node => {
                //     node?.remove()
                // })
                document.querySelectorAll('article.zenad-card-rtb').forEach(node => {
                    node?.remove()
                })
                document.querySelectorAll('div.zenad-card-rtb__ad').forEach(node => {
                    node?.remove()
                })
            }
        }
        // if (node_test && node_test.nodeName === 'IMG') {
        //     const DivBlockclassList = Array.from(node_test.classList);
        //     if (DivBlockclassList.some(className => className === 'zen-ui-zen-image-cover__image')
        //        ) {
        //         document.querySelectorAll('article.card-wrapper').forEach(node => {
        //             node?.remove()
        //         })
        //         document.querySelectorAll('div.zenad-card-rtb__ad').forEach(node => {
        //             node?.remove()
        //         })
        //     }
        // }


    }
    // Поиск элемент с текстом "Реклама" внутри всех #shadow-root и определение блоков до #shadow-root
    function mail_ru_checkAndRemove_РекламаВShadow() {

        //         // Функция для поиска элемента по текстовому содержимому внутри shadow DOM
        //         function findElementByTextInShadow(shadowRoot, tag, text) {
        //             const elements = shadowRoot.querySelectorAll(tag);
        //             for (let i = 0; i < elements.length; i++) {
        //                 if (elements[i].textContent === text) {
        //                     return elements[i];
        //                 }
        //             }
        //             return null;
        //         }

        //         // Найти все shadow host'ы на странице
        //         const shadowHosts = document.querySelectorAll('*');

        //         shadowHosts.forEach(shadowHost => {
        //             const shadowRoot = shadowHost.shadowRoot;

        //             if (shadowRoot) {
        //                 // Найти элемент с текстом "Реклама" внутри shadow root
        //                 const рекламаElement = findElementByTextInShadow(shadowRoot, 'span', 'Реклама');

        //                 if (рекламаElement) {
        //                     // Подняться по родительским нодам вплоть до shadow-root
        //                     let currentNode = рекламаElement;
        //                     while (currentNode && currentNode.parentNode !== shadowRoot) {
        //                         currentNode = currentNode.parentNode;
        //                     }

        //                     // Теперь currentNode указывает на элемент, непосредственно следующий за shadow-root
        //                     console.log(currentNode);
        //                 } else {
        //                     console.log('Элемент с текстом "Реклама" не найден внутри shadow root');
        //                 }
        //             } else {
        //                 console.log('Shadow root не найден');
        //             }
        //         });





        //*************


        //         function findParentNodeAboveShadowRoot() {
        //             const adSpan = document.querySelector('span:contains("Реклама")');

        //             if (adSpan) {
        //                 let currentNode = adSpan.parentNode;
        //                 while (currentNode && currentNode.id !== 'shadow-root') {
        //                     currentNode = currentNode.parentNode;
        //                 }

        //                 if (currentNode && currentNode.parentNode) {
        //                     return currentNode.parentNode;
        //                 }
        //             }

        //             return null;
        //         }

        //         const parentNode = findParentNodeAboveShadowRoot();

        //         if (parentNode) {
        //             console.log('Parent node above shadow-root:', parentNode);
        //         } else {
        //             console.log('Could not find the specified node.');
        //         }

        //*****************


        function findParentNodeAboveShadowRoot() {

            // Find all elements with a closed shadow root
            const shadowRoots = Array.from(document.querySelectorAll('*')).filter(el => el.shadowRoot && el.shadowRoot.mode === 'closed');

            // Iterate through the shadow roots and change their mode to 'open'
            shadowRoots.forEach(el => {
                el.shadowRoot.mode = 'open';
            });

            // Find all span elements
            const spans = document.querySelectorAll('span');

            // Iterate through the spans and find the one with the text "Реклама"
            for (let i = 0; i < spans.length; i++) {
                if (spans[i].textContent === 'Реклама') {
                    let currentNode = spans[i].parentNode;

                    // Traverse up the DOM until the shadow root is found
                    while (currentNode && currentNode.id !== 'shadow-root') {
                        currentNode = currentNode.parentNode;
                    }

                    // Return the parent of the shadow root
                    if (currentNode && currentNode.parentNode) {
                        return currentNode.parentNode;
                    }
                }
            }

            return null; // Return null if the node is not found
        }

        const parentNode = findParentNodeAboveShadowRoot();

        if (parentNode) {
            console.log('Parent node above shadow-root:', parentNode);
        } else {
            console.log('Could not find the specified node.');
        }








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

    // определение мобильное устройство или ПК
    function isMobileDevice() {
        return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
    }

    //     // Обработка события hashchange
    //     window.addEventListener('hashchange', handleUrlChange);

    //     // Обработка события popstate
    //     window.addEventListener('popstate', handleUrlChange);

    // Проверка изменений в URL при загрузке страницы
    handleUrlChange();



})();
