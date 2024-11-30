import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe ('API challenge', ()=> {
    let URL = 'https://apichallenges.herokuapp.com/';
    let token;
    let progress;
    let challengerData;

    //--------------------------- Getting Started ---------------------------
    // 1. POST /challenger (201)
    test.beforeAll (async ({ request })  => {
        let response = await request.post(`${URL}challenger`);
        let headers = await response.headers();
        token = headers['x-challenger'];
        console.log(`Прогресс испытаний https://apichallenges.herokuapp.com/gui/challenges/${token}`);
        expect(headers).toEqual(expect.objectContaining({'x-challenger':expect.any(String)}));
        expect(response.status()).toBe(201);
    });
    
    //--------------------------- First Real Challenge ---------------------------
        // 2. GET /challenges (200)
        test('Получить список испытаний GET /challenges @API', async ({request}) => {
            let response = await request.get(`${URL}challenges`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.json();
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers).toEqual(expect.objectContaining({"x-challenger": token}));
            expect(body.challenges.length).toBe(59);
        });

    //--------------------------- GET Challenges ---------------------------       
        // 3. GET /todos (200)
        test('Получить список заданий GET /todos @API', async ({request}) => {
            let response = await request.get(`${URL}todos`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.json();
            expect(response.status()).toBe(200);
            expect(body).toHaveProperty('todos');
        });

        // 4. GET /todo (404) not plural
        test('Получить ошибку по несуществующей ручке GET /todo @API', async ({request}) => {
            let response = await request.get(`${URL}todo`, {
                headers: {
                    "x-challenger": token,
                },
            });
            expect(response.status()).toBe(404);
        });

        // 5. GET /todos/{id} (200)
        test('Получить определенную задачу GET /todos/{id} @API', async ({request}) => {
            let response = await request.get(`${URL}todos/2`, {
                headers: { 
                    "x-challenger": token },
              });
            let body = await response.json();
            expect(response.status()).toBe(200);
            expect(body.todos[0].id).toBe(2);
        });

        // 6. GET /todos/{id} (404)
        test('Получить ошибку по несуществующему заданию GET /todos/{id} @API', async ({request}) => {
            let response = await request.get(`${URL}todos/99`, {
                headers: { 
                    "x-challenger": token },
              });
            expect(response.status()).toBe(404);
        });
         
        // 9. POST /todos (201)
        test ("Coздать новое задание POST /todos @API", async ({ request }) => {
            const todo = {
                'title': "create todo process payroll",
                'doneStatus': true,
                'description': ""
                };
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            let body = await response.json();
            expect(response.status()).toBe(201);
            expect(body).toEqual(expect.objectContaining(todo));
        });

        // 7. GET /todos (200) ?filter
        test('Получить список выполненных заданий GET /todos @API', async ({request}) => {
            const filter = {
                "doneStatus": true
              };
            let response = await request.get(`${URL}todos`, {
                headers: {
                  "x-challenger": token,
                },
                params: filter,
              });
            let body = await response.json();
            expect(response.status()).toBe(200);
            expect(body.todos).toEqual(expect.arrayContaining([expect.objectContaining({doneStatus: true})]));
        });

    //--------------------------- HEAD Challenges ---------------------------   
        // 8. HEAD /todos (200)
        test('Получить заголовок задания HEAD /todos @API', async ({request}) => {
            let response = await request.head(`${URL}todos`, {
                headers: { 
                    "x-challenger": token },
              });
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers['content-type']).toBe('application/json');
            expect(headers).toEqual (expect.objectContaining({'x-challenger':token}));
        });

    //--------------------------- Creation Challenges with POST ---------------------------         
        // 10. POST /todos (400) doneStatus
        test ("Получить ошибку некорректного типа данных для статуса POST /todos @API", async ({ request }) => {
            const todo = {
                'title': "create new todo",
                'doneStatus': "bob",
                'description': "created via insomnia"
                };
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            let body = await response.json();

            expect(response.status()).toBe(400);
            expect(body).toHaveProperty('errorMessages');
            expect(body.errorMessages).toContain("Failed Validation: doneStatus should be BOOLEAN but was STRING");
        });

        // 11. POST /todos (400) title too long
        test ("Получить ошибку максимального допустимого количества символов в заголовке POST /todos @API", async ({ request }) => {
            const todo = {
                'title': faker.string.alpha({ length: { min: 51, max: 100 } }),
                'doneStatus': true,
                'description': "created via insomnia"
                };
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            let body = await response.json();
            expect(response.status()).toBe(400);
            expect(body).toHaveProperty('errorMessages');
            expect(body.errorMessages).toContain("Failed Validation: Maximum allowable length exceeded for title - maximum allowed is 50");
        });
        
        // 12. POST /todos (400) description too long
        test ("Получить ошибку максимального допустимого количества символов в описании POST /todos @API", async ({ request }) => {
            const todo = {
                'title': "create new todo",
                'doneStatus': true,
                'description': faker.string.alpha({ length: { min: 201, max: 1000 } })
                };
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            let body = await response.json();
            expect(response.status()).toBe(400);
            expect(body).toHaveProperty('errorMessages');
            expect(body.errorMessages).toContain("Failed Validation: Maximum allowable length exceeded for description - maximum allowed is 200");
        });       
        
        // 13. POST /todos (201) max out content
        test ("Создать задание с максимально разрешенным наполнением POST /todos @API", async ({ request }) => {
            const todo = {
                'title': faker.string.alpha({ length: { min: 50, max: 50 } }),
                'doneStatus': true,
                'description': faker.string.alpha({ length: { min: 200, max: 200 } })
                };
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            expect(response.status()).toBe(201);
        });    

        // 14. POST /todos (413) content too long
        test ("Создать задание, превышающее размер 5000 байт POST /todos @API", async ({ request }) => {
            const todo = {
                'title': faker.string.alpha({ length: { min: 2500, max: 5000 } }),
                'doneStatus': true,
                'description': faker.string.alpha({ length: { min: 2500, max: 5000 } })
                };
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            let body = await response.json();
            expect(response.status()).toBe(413);
            expect(body).toHaveProperty('errorMessages');
            expect(body.errorMessages).toContain("Error: Request body too large, max allowed is 5000 bytes");
        });   
 
        // 15. POST /todos (400) extra
        test ("Получить ошибку несуществующего поля POST /todos @API", async ({ request }) => {
            const todo = {
                'title': "create new todo",
                'doneStatus': true,
                'description': "created via insomnia",
                'unrecognisedField': false
                };
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            let body = await response.json();
            expect(response.status()).toBe(400);
            expect(body).toHaveProperty('errorMessages');
            expect(body.errorMessages).toContain("Could not find field: unrecognisedField");
        });  

    //--------------------------- Creation Challenges with PUT ---------------------------           
        // 16. PUT /todos/{id} (400)
        test ("Изменить задание PUT /todos @API", async ({ request }) => {
            const todo = {
                'title': "create new todo",
                'doneStatus': true,
                'description': "created via insomnia",
                };
            let response = await request.put(`${URL}todos/666`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            let body = await response.json();
            expect(response.status()).toBe(400);
            expect(body).toHaveProperty('errorMessages');
            expect(body.errorMessages).toContain("Cannot create todo with PUT due to Auto fields id");
        });  

    //--------------------------- Update Challenges with POST ---------------------------              
        // 17. POST /todos/{id} (200)
        test ("Изменить заголовок задания POST /todos @API", async ({ request }) => {
            const todo = {
                "title": "updated title"
              }
            let response = await request.post(`${URL}todos/7`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            expect(response.status()).toBe(200);
        });  

        // 18. POST /todos/{id} (404)
        test ("Получить ошибку несуществующего запроса POST /todos @API", async ({ request }) => {
            const todo = {
                title: "create new todo"
            };
            let response = await request.post(`${URL}todos/100`, {
                headers: {
                'x-challenger': token
                },
                data: todo
            });
            expect(response.status()).toBe(404);
        });  

    //--------------------------- Update Challenges with PUT ---------------------------          
        // 19. PUT /todos/{id} full (200)
        test ("Изменить полностью задание PUT /todos @API", async ({ request }) => {
            const todo = {
                'title': "updated title",
                'doneStatus': false,
                'description': "new todo"
            };
            let response = await request.put(`${URL}todos/7`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            let body = await response.json();
            expect(response.status()).toBe(200);
            expect(body).toEqual(expect.objectContaining(todo));
        });  

        // 20. PUT /todos/{id} partial (200)	
        test ("Изменить частично задание PUT /todos @API", async ({ request }) => {
            const todo = {
                'title': "updated title",
            };
            let response = await request.put(`${URL}todos/7`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            let body = await response.json();
            expect(response.status()).toBe(200);
            expect(body).toEqual(expect.objectContaining(todo));
        });  

        // 21. PUT /todos/{id} no title (400)		
        test ("Получить ошибку обновления задания без заголовка PUT /todos @API", async ({ request }) => {
            const todo = {
                'doneStatus': false,
            };
            let response = await request.put(`${URL}todos/7`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            expect(response.status()).toBe(400);
        });  

        // 22. PUT /todos/{id} no amend id (400)		
        test ("Получить ошибку обновления идентификатора задания PUT /todos @API", async ({ request }) => {
            const todo = {
                'id': 16,
                'title': "updated title",
                'doneStatus': false,
                'description': "new todo"
            };
            let response = await request.put(`${URL}todos/7`, {
                headers: {
                    'x-challenger': token
                },
                data: todo
            });
            expect(response.status()).toBe(400);
        }); 

    //--------------------------- DELETE Challenges ---------------------------              
        // 23. DELETE /todos/{id} (200)			
        test ("Удалить задание DELETE /todos @API", async ({ request }) => {
            let response = await request.delete(`${URL}todos/7`, {
                headers: {
                'x-challenger': token
            }
            });
            expect(response.status()).toBe(200);
        }); 

    //--------------------------- OPTIONS Challenges ---------------------------                   
        // 24. OPTIONS /todos (200)				
        test ("Получить список валидных методов для запроса OPTIONS /todos @API", async ({ request }) => {
            // В Playwright метод "options" не является функцией, а вместо этого используется метод "fetch" с указанием метода "OPTIONS"
            let response = await request.fetch(`${URL}todos`, {
                headers: {
                    'x-challenger': token
                },
                method: 'OPTIONS'
            });
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers).toHaveProperty('allow');
            expect(headers.allow).toContain("OPTIONS, GET, HEAD, POST");
        });

    //--------------------------- Accept Challenges ---------------------------          
        // 25. GET /todos (200) XML				
        test ("Получить ответ в формате XML GET /todos @API", async ({ request }) => {
            let response = await request.get(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': 'application/xml'
                }
            });
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers['content-type']).toBe('application/xml');
        });

        // 26. GET /todos (200) JSON				
        test ("Получить ответ в формате JSON GET /todos @API", async ({ request }) => {
            let response = await request.get(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': 'application/json'
                }
            });
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers['content-type']).toBe('application/json');
        });

        // 27. GET /todos (200) ANY					
        test ("Получить ответ в формате JSON по умолчанию GET /todos @API", async ({ request }) => {
            let response = await request.get(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': '*/*'
                }
            });
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers['content-type']).toBe('application/json');
        });

        // 28. GET /todos (200) XML pref				
        test ("Получить ответ в формате XML по умолчанию GET /todos @API", async ({ request }) => {
            let response = await request.get(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': 'application/xml, application/json'
                }
            });
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers['content-type']).toBe('application/xml');
        });

        // 29. GET /todos (200) no accept
        test ("Получить ответ в формате JSON по дефолту GET /todos @API", async ({ request }) => {
            let response = await request.get(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': ''
                }
            });
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers['content-type']).toBe('application/json');
        });

        // 30. GET /todos (406)
        test ("Получить ошибку несуществующего типа ассерта GET /todos @API", async ({ request }) => {
            let response = await request.get(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': 'application/gzip'
                }
            });
            expect(response.status()).toBe(406);
        });

    //--------------------------- Content-Type Challenges ---------------------------          
        // 31. POST /todos XML
        test ("Создать задачу в формате запроса XML POST /todos @API", async ({ request }) => {
            const todo = 
            `<todo>
                <doneStatus>true</doneStatus>
                <description>file paperwork today</description>
                <title>file paperwork today</title>
            </todo>`;
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': 'application/xml',
                    'Content-Type': 'application/xml'
                },
                data: todo
            });
            let headers = await response.headers();
            let body = await response.text();
            expect(response.status()).toBe(201);
            expect(headers['content-type']).toBe('application/xml');
            expect(body).toEqual(expect.stringContaining('<todo>'));
        });

        // 32. POST /todos JSON
        test ("Создать задачу в формате запроса JSON POST /todos @API", async ({ request }) => {
            const todo = {
                'title': "create todo process payroll",
                'doneStatus': true,
                'description': "Hi! :)"
                };
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: todo
            });
            let headers = await response.headers();
            let body = await response.json();
            expect(response.status()).toBe(201);
            expect(headers['content-type']).toBe('application/json');
            expect(body).toEqual(expect.objectContaining(todo));
        });

        // 33. POST /todos (415)
        test ("Получить ошибку неподдердживаемого типа контента POST /todos @API", async ({ request }) => {
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': 'application/json',
                    'Content-Type': 'bob'
                }
            });   
            expect(response.status()).toBe(415);
        });

    //--------------------------- Fancy a Break? Restore your session ---------------------------             
        // 34. GET /challenger/guid (existing X-CHALLENGER)
        test ("Получить текущий прогресс испытаний GET /challenger @API", async ({ request }) => {
            let response = await request.get(`${URL}challenger/${token}`, {
                headers: {
                    "x-challenger": token,
                    "Content-Type": "application/json"
                }
            });   
            let headers = await response.headers();
            challengerData = await response.json();
            expect(response.status()).toBe(200);
            expect(headers).toEqual(expect.objectContaining({"x-challenger": token}));
        });

        // 36. PUT /challenger/guid CREATE
        test("Создать прогресс испытаний PUT /challenger @API", async ({ request }) => {
            let newChallengerData = { ...challengerData };
            if (newChallengerData.challengeStatus.PUT_NEW_RESTORED_CHALLENGER_PROGRESS_STATUS === false) {
                newChallengerData.challengeStatus.PUT_NEW_RESTORED_CHALLENGER_PROGRESS_STATUS = true;
            }

            let response = await request.put(`${URL}/challenger/${token}`, {
                headers: {
                    "x-challenger": token,
                    "Content-Type": "application/json"
                },
                data: newChallengerData
            });
            let body = await response.json();
            expect(response.status()).toBe(200);
            expect(body).toHaveProperty("challengeStatus");
        });

        // 35. PUT /challenger/guid RESTORE
        test ("Восстановить прогресс испытаний PUT /challenger @API", async ({ request }) => {
            let response = await request.put(`${URL}challenger/${token}`, {
                headers: {
                    "x-challenger": token,
                },
                data: challengerData,
            });
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers).toEqual(expect.objectContaining({"x-challenger": token}));
        });

        // 37. GET /challenger/database/guid (200)
        test ("Получить текущий прогресс испытаний из бд GET /challenger @API", async ({ request }) => {
            let response = await request.get(`${URL}challenger/database/${token}`, {
                headers: {
                    'x-challenger': token,
                }
            });   
            progress = await response.json();
            let headers = await response.headers();
            expect(response.status()).toBe(200);
            expect(headers).toEqual(expect.objectContaining({"x-challenger": token}));
        });       

        // 38. PUT /challenger/database/guid (Update)
        test ("Изменить текущий прогресс испытаний из бд PUT /challenger @API", async ({ request }) => {
            let response = await request.put(`${URL}challenger/database/${token}`, {
                headers: {
                    'x-challenger': token,
                },
                data: progress
            });   
            let headers = await response.headers();
            expect(response.status()).toBe(204);
            expect(headers).toEqual(expect.objectContaining({"x-challenger": token}));
        }); 

    //--------------------------- Mix Accept and Content-Type Challenges ---------------------------          
        // 39. POST /todos XML to JSON
        test ("Получить ответ в JSON при отправление XML запроса POST /todos @API", async ({ request }) => {
            const todo = 
            `<todo>
                <doneStatus>true</doneStatus>
                <description>file paperwork today</description>
                <title>file paperwork today</title>
            </todo>`;            
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': 'application/json',
                    'Content-type': 'application/xml'
                },
                data: todo
            });   
            let headers = await response.headers();
            expect(response.status()).toBe(201);
            expect(headers['content-type']).toBe('application/json');
        }); 

        // 40. POST /todos JSON to XML
        test ("Получить ответ в XML при отправление JSON запроса POST /todos @API", async ({ request }) => {
            const todo = {
                'title': "create todo process payroll",
                'doneStatus': true,
                'description': "Hi! :)"
                };          
            let response = await request.post(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                    'Accept': 'application/xml',
                    'Content-type': 'application/json'
                },
                data: todo
            });   
            let headers = await response.headers();
            expect(response.status()).toBe(201);
            expect(headers['content-type']).toBe('application/xml');
        }); 

    //--------------------------- Status Code Challenges ---------------------------   
        // 41. DELETE /heartbeat (405)
        test ("Получить ошибку при запрещенном методе DELETE /heartbeat @API", async ({ request }) => {       
                let response = await request.delete(`${URL}heartbeat`, {
                    headers: {
                        'x-challenger': token,
                    }
                });   
                expect(response.status()).toBe(405);
            }); 

         // 42. PATCH /heartbeat (500)
         test ("Получить ошибку внутреннюю ошибку сервера PATCH /heartbeat @API", async ({ request }) => {       
            let response = await request.patch(`${URL}heartbeat`, {
                headers: {
                    'x-challenger': token,
                }
            });   
            expect(response.status()).toBe(500);
        });       
        
         // 43. TRACE /heartbeat (501)
         test ("Получить ошибку несуществующего метода TRACE /heartbeat @API", async ({ request }) => {    
            // В Playwright метод "trace" не является функцией, а вместо этого используется метод "fetch" с указанием метода "TRACE"   
            let response = await request.fetch(`${URL}heartbeat`, {
                headers: {
                    'x-challenger': token,
                },
                method: 'TRACE'
            });   
            expect(response.status()).toBe(501);
        });        
        
         // 44. GET /heartbeat (204)
         test ("Получить ошибку несуществующего контента GET /heartbeat @API", async ({ request }) => {       
            let response = await request.get(`${URL}heartbeat`, {
                headers: {
                    'x-challenger': token,
                }
            });   
            expect(response.status()).toBe(204);
        });         
    //--------------------------- HTTP Method Override Challenges ---------------------------  
        // 45. POST /heartbeat as DELETE (405)
        test ("Получить ошибку при переопределении метода на удаление POST /heartbeat @API", async ({ request }) => {       
            let response = await request.post(`${URL}heartbeat`, {
                headers: {
                    'x-challenger': token,
                    'X-HTTP-Method-Override': 'DELETE'
                }
            });   
            expect(response.status()).toBe(405);
        });    

        // 46. POST /heartbeat as PATCH (500)
        test ("Получить ошибку при переопределении метода на частичное обновление POST /heartbeat @API", async ({ request }) => {       
            let response = await request.post(`${URL}heartbeat`, {
                headers: {
                    'x-challenger': token,
                    'X-HTTP-Method-Override': 'PATCH'
                }
            });   
            expect(response.status()).toBe(500);
        }); 

        // 47. POST /heartbeat as Trace (501)
        test ("Получить ошибку при переопределении метода на метод отладки POST /heartbeat @API", async ({ request }) => {       
            let response = await request.post(`${URL}heartbeat`, {
                headers: {
                    'x-challenger': token,
                    'X-HTTP-Method-Override': 'TRACE'
                }
            });   
            expect(response.status()).toBe(501);
        });         

    //--------------------------- Authentication Challenges ---------------------------   
        // 48. POST /secret/token (401)
        test ("Получить ошибку аутентификации с некорректным логином/паролем POST /secret @API", async ({ request }) => {       
            let response = await request.post(`${URL}secret/token`, {
                headers: {
                    'x-challenger': token,
                    'Authorization': 'Basic YWRtaW46cGFzc3dvcmRk'
                }
            });   
            expect(response.status()).toBe(401);
        });

        // 49. POST /secret/token (201)
        test ("Аутентификация с корректным логином/паролем POST /secret @API", async ({ request }) => {       
            let response = await request.post(`${URL}secret/token`, {
                headers: {
                    'x-challenger': token,
                    'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ='
                }
            });   
            expect(response.status()).toBe(201);
        });       

    //--------------------------- Authorization Challenges --------------------------- 
        // 50. GET /secret/note (403)
        test ("Получить ошибку аутентификации GET /secret @API", async ({ request }) => {       
            let response = await request.get(`${URL}secret/note`, {
                headers: {
                    'x-challenger': token,
                    'x-auth-token': 'bob'
                }
            });   
            expect(response.status()).toBe(403);
        });   

        // 51. GET /secret/note (401)
        test ("Получить ошибку отсутсnвия заголовка токена GET /secret @API", async ({ request }) => {       
            let response = await request.get(`${URL}secret/note`, {
                headers: {
                    'x-challenger': token
                }
            });   
            expect(response.status()).toBe(401);
        });         
        
        // 52. GET /secret/note (200)
        test ("Аутентификация с корректным токеном GET /secret @API", async ({ request }) => {       
            let responsePost = await request.post(`${URL}secret/token`, {
                headers: {
                    'x-challenger': token,
                    'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ='
                }
            });
            let headersPost = await responsePost.headers();
            let tokenAuth = headersPost['x-auth-token'];
            let responseGet = await request.get(`${URL}secret/note`, {
                headers: {
                    'x-challenger': token,
                    'x-auth-token': tokenAuth
                }
            });
            expect(responseGet.status()).toBe(200);
        });  

        // 53. POST /secret/note (200)
        test ("Создать заметку POST /secret @API", async ({ request }) => {       
            const note = {
                'note':'my note'
            }
            let responsePost = await request.post(`${URL}secret/token`, {
                headers: {
                    'x-challenger': token,
                    'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ='
                }
            });
            let headersPost = await responsePost.headers();
            let tokenAuth = headersPost['x-auth-token'];
            let responseGet = await request.post(`${URL}secret/note`, {
                headers: {
                    'x-challenger': token,
                    'x-auth-token': tokenAuth
                },
                data: note
            });
            expect(responseGet.status()).toBe(200);
        }); 
        
        // 54. POST /secret/note (401)
        test ("Получить ошибку при создании заметки и отсутсвуия токена POST /secret @API", async ({ request }) => {       
            const note = {
                'note':'my note'
            }
            let response = await request.post(`${URL}secret/note`, {
                headers: {
                    'x-challenger': token,
                },
                data: note
            });
            expect(response.status()).toBe(401);
        });    

        // 55. POST /secret/note (403)
        test ("Получить ошибку при создании заметки с некорректным токеном POST /secret @API", async ({ request }) => {       
            const note = {
                'note':'my note'
            }
            let response = await request.post(`${URL}secret/note`, {
                headers: {
                    'x-challenger': token,
                    'x-auth-token': 'not token'
                },
                data: note
            });
            expect(response.status()).toBe(403);
        });    

        // 56. GET /secret/note (Bearer)
        test ("Получить информацию о заметке GET /secret @API", async ({ request }) => {       
            let responsePost = await request.post(`${URL}secret/token`, {
                headers: {
                    'x-challenger': token,
                    'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ='
                }
            });
            let headersPost = await responsePost.headers();
            let tokenAuth = headersPost['x-auth-token'];
            let responseGet = await request.get(`${URL}secret/note`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-challenger': token,
                    'Authorization': `Bearer ${tokenAuth}`
                }
            });
            expect(responseGet.status()).toBe(200);
        }); 

        // 57. POST /secret/note (Bearer)
        test ("Создать заметку по токену авторизации POST /secret @API", async ({ request }) => {       
            const note = {
                'note':'my note edited bearer'
            }
            let responsePost = await request.post(`${URL}secret/token`, {
                headers: {
                    'x-challenger': token,
                    'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ='
                }
            });
            let headersPost = await responsePost.headers();
            let tokenAuth = headersPost['x-auth-token'];
            let responseGet = await request.post(`${URL}secret/note`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-challenger': token,
                    'Authorization': `Bearer ${tokenAuth}`
                },
                data: note
            });
            expect(responseGet.status()).toBe(200);
        }); 

//--------------------------- Miscellaneous Challenges --------------------------- 
       // 58. DELETE /todos/{id} (200) all
       test ("Удалить все задачи DELETE /todos @API", async ({ request }) => {       
            let responseGet = await request.get(`${URL}todos`, {
                headers: {
                    'x-challenger': token,
                }
            });
            let body = await responseGet.json();
            let ids = body.todos.map(todo => todo.id);
            for (let id of ids) {
                let responseDelete = await request.delete(`${URL}todos/${id}`, {
                    headers: {
                        'x-challenger': token,
                    }
                });  
                expect(responseDelete.status()).toBe(200);
            };    
        }); 

       // 59. POST /todos (201) all
       test ("Создать максимальное количество задач POST /todos @API", async ({ request }) => {   
        const todo = {
            title: faker.string.alpha(50),
            doneStatus: true,
            description: faker.string.alpha(200)
            };
            const max = 20;
            for (let i = 0; i <= max; i++) {
                let responseCreate = await request.post(`${URL}todos`, {
                  headers: {
                    "x-challenger": token,

                  },
                  data: todo
                });
            let body = await responseCreate.json();
            if (await responseCreate.status() === 201) {
                await expect(body).toEqual(expect.objectContaining({title: todo.title,doneStatus: todo.doneStatus,description: todo.description,id: expect.any(Number)}));
              } else if (await responseCreate.status() === 400) {
                await expect(body.errorMessages).toContain("ERROR: Cannot add instance, maximum limit of 20 reached");
              }
        }
    }); 
}); 
