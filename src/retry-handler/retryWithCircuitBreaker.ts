
import CircuitBreaker from "opossum";

const MAX_RETRIES = 3; //Maximum number of retry attempts allowed for the operation
const BASE_RETRY_DELAY = 1000; //Initial delay in milliseconds before retrying a failed operation.

export async function retryAndBreakerOperation<T>(operation:()=>Promise<T>){
    let retries = 0; //Keep track of the number of retry attempts made.
    let retryDelay = BASE_RETRY_DELAY; //Current delay before the next retry attempt, initially set to 'BASE_RETRY_DELAY'.
    let CircuitBreakerOpened = false;//Indicating whether the circuit breaker is open or not ?

    const increaseRetryDelay=()=>{
        retryDelay *= 2;
        return Math.min(retryDelay,60000); // doubles the retry delay and ensure it doesn't exceed 60 seconds.
    };

    const circuitBreaker = new CircuitBreaker(operation,{
        timeout:5000, // sets a timeout of 5 seconds for the operation.
        errorThresholdPercentage:50,  // The circuit breaker will open if 50% or more of the request fail.
        resetTimeout:30000 // After 30 seconds, the circuit breaker will move from the open state to half open state , allowing some traffic to test if the underlying issue is resolved.
    });

    circuitBreaker.on('open',()=>{
        console.log('Circuit Breaker Open');
        CircuitBreakerOpened=true;
    });

    circuitBreaker.on('halfOpen',()=>{
        console.log('Circuit breaker half open');
        CircuitBreakerOpened = false;
    });

    circuitBreaker.on('close',()=>{
        console.log('Circuit breaker closed');
        CircuitBreakerOpened = false;
    });

    while(retries < MAX_RETRIES){
        try {
            if(!CircuitBreakerOpened){ //if the circuit breaker is not open , this line attempts to execute the operation through the circuit breaker by calling its 'fire' method.
                return await circuitBreaker.fire();
            }
            else{
                console.log('Circuit breaker is open or half open. Retry',retries);
                retries++;
                await new Promise((resolve)=>setTimeout(resolve,retryDelay));
                retryDelay = increaseRetryDelay();
            }
        } catch (error) {
            if(retries === MAX_RETRIES-1){ //if this is the last retry attempts , rethrow the error.
                throw error;
            }
            else{
                retries++;
                await new Promise((resolve)=>setTimeout(resolve,retryDelay));
                retryDelay = increaseRetryDelay();
            }
        }
    }
    circuitBreaker.open();
}