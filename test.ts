try {
    const output = Deno.env.get('LOL');
    console.log(output);
} catch (error) {
    console.error(error);
}
